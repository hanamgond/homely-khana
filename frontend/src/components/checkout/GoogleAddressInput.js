'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
// 1. IMPORT THE SAFE LOADER
import { useJsApiLoader } from '@react-google-maps/api';

// 2. DEFINE LIBRARIES OUTSIDE (Prevents unnecessary re-renders)
const LIBRARIES = ['places'];

export default function GoogleAddressInput({ onAddressSelect }) {
    const [query, setQuery] = useState('');
    const [predictions, setPredictions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // 3. SAFE LOADING HOOK
    // This hook checks if "window.google" exists. If yes, it skips loading.
    // If no, it loads it once. This fixes the crash.
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES
    });

    // Refs for Cost Savings (Session Token)
    const autocompleteService = useRef(null);
    const placesService = useRef(null);
    const sessionToken = useRef(null);

    // 4. INIT SERVICES (Only when script is ready)
    useEffect(() => {
        if (isLoaded && window.google && !autocompleteService.current) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
            placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
            // Start the Cost-Saving Session
            sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
        }
    }, [isLoaded]);

    // 5. DEBOUNCED SEARCH (Preserves Cost Saving)
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only search if query is long enough AND script is loaded
            if (query.length > 3 && isLoaded) {
                fetchPredictions();
            }
        }, 400); // 400ms delay to save API calls while typing

        return () => clearTimeout(timer);
    }, [query, isLoaded]);

    const fetchPredictions = () => {
        if (!autocompleteService.current) return;
        
        setIsLoading(true);
        
        const request = {
            input: query,
            componentRestrictions: { country: 'in' },
            // CRITICAL: Passing sessionToken groups all these searches into "0" cost
            sessionToken: sessionToken.current, 
        };

        autocompleteService.current.getPlacePredictions(request, (results, status) => {
            setIsLoading(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                setPredictions(results);
            } else {
                setPredictions([]);
            }
        });
    };

    // 6. HANDLE SELECTION (The Single Billable Event)
    const handleSelect = (placeId) => {
        if (!placesService.current) return;

        const request = {
            placeId: placeId,
            fields: ['name', 'formatted_address', 'address_components', 'geometry'],
            // CRITICAL: Passing token here "closes" the session. 
            // You are billed for ONE "Place Details" call, not for the searches.
            sessionToken: sessionToken.current,
        };

        placesService.current.getDetails(request, (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                let address = {
                    addressLine1: '',
                    city: '',
                    state: '',
                    pincode: '',
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                };

                place.address_components.forEach(comp => {
                    if (comp.types.includes('locality')) address.city = comp.long_name;
                    if (comp.types.includes('administrative_area_level_1')) address.state = comp.long_name;
                    if (comp.types.includes('postal_code')) address.pincode = comp.long_name;
                });

                address.addressLine1 = place.name || place.formatted_address.split(',')[0];

                onAddressSelect(address);
                setPredictions([]);
                setQuery('');
                
                // REFRESH TOKEN: Start a fresh session for the next search
                sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
            } else {
                toast.error("Failed to fetch address details");
            }
        });
    };

    // 7. UI RENDER (Unchanged)
    return (
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Search Address (Google Maps)
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search 'Seawoods Grand Central'..."
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.95rem'
                    }}
                />
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                {isLoading && (
                    <Loader2 size={18} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ea580c' }} />
                )}
            </div>

            {predictions.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 50,
                    marginTop: '4px',
                    maxHeight: '250px',
                    overflowY: 'auto'
                }}>
                    {predictions.map((pred) => (
                        <div
                            key={pred.place_id}
                            onClick={() => handleSelect(pred.place_id)}
                            style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f3f4f6',
                                display: 'flex',
                                alignItems: 'start',
                                gap: '10px'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                            <MapPin size={16} style={{ marginTop: '3px', color: '#ea580c', flexShrink: 0 }} />
                            <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1f2937' }}>
                                    {pred.structured_formatting.main_text}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    {pred.structured_formatting.secondary_text}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div style={{ padding: '8px', textAlign: 'right' }}>
                        <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png" alt="Powered by Google" />
                    </div>
                </div>
            )}
        </div>
    );
}
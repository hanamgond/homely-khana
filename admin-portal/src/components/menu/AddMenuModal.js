'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';

export default function AddMenuModal({ isOpen, onClose, onRefresh, editingItem = null, initialDay = 'Monday', initialType = 'Lunch' }) {
    const [loading, setLoading] = useState(false);
    
    // Default Empty State
    const defaultState = {
        title: '',
        description: '',
        price: '',
        calories: '',
        day_of_week: initialDay,
        meal_type: initialType,
        is_veg: true,
        tags: ''
    };

    const [formData, setFormData] = useState(defaultState);

    // Effect: If editingItem changes, populate the form. If null, reset it.
    useEffect(() => {
        if (editingItem) {
            setFormData({
                ...editingItem,
                tags: Array.isArray(editingItem.tags) ? editingItem.tags.join(', ') : editingItem.tags || ''
            });
        } else {
            setFormData({ ...defaultState, day_of_week: initialDay, meal_type: initialType });
        }
    }, [editingItem, isOpen, initialDay, initialType]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Determine URL and Method based on mode (Edit vs Create)
        const url = editingItem 
            ? `${process.env.NEXT_PUBLIC_URL}/api/menu/update/${editingItem.id}`
            : `${process.env.NEXT_PUBLIC_URL}/api/menu/add`;
        
        const method = editingItem ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) // Clean up tags
                })
            });
            const data = await res.json();
            
            if (data.success) {
                onRefresh();
                onClose();
            } else {
                alert("Error: " + data.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">
                        {editingItem ? 'Edit Dish' : `Add ${formData.meal_type} for ${formData.day_of_week}`}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title & Price */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Dish Name</label>
                            <input required type="text" placeholder="e.g. Paneer Butter Masala" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none"
                                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
                            <input required type="number" placeholder="120" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none"
                                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                        <textarea required rows="2" placeholder="Ingredients, taste profile..." className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none"
                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>

                    {/* Scheduling */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Day</label>
                            <select className="w-full border rounded-lg p-2.5 bg-white"
                                value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: e.target.value})}>
                                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                            <select className="w-full border rounded-lg p-2.5 bg-white"
                                value={formData.meal_type} onChange={e => setFormData({...formData, meal_type: e.target.value})}>
                                <option value="Lunch">Lunch</option>
                                <option value="Dinner">Dinner</option>
                            </select>
                        </div>
                    </div>

                    {/* Meta Data */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Calories</label>
                            <input type="text" placeholder="450" className="w-full border rounded-lg p-2.5 outline-none"
                                value={formData.calories} onChange={e => setFormData({...formData, calories: e.target.value})} />
                        </div>
                        <div className="flex items-center gap-4 mt-6">
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" checked={formData.is_veg} onChange={() => setFormData({...formData, is_veg: true})} className="w-4 h-4 text-green-600" />
                                <span className="ml-2 text-sm">Veg</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" checked={!formData.is_veg} onChange={() => setFormData({...formData, is_veg: false})} className="w-4 h-4 text-red-600" />
                                <span className="ml-2 text-sm">Non-Veg</span>
                            </label>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-1">Tags (Optional)</label>
                         <input type="text" placeholder="Spicy, Bestseller (comma separated)" className="w-full border rounded-lg p-2.5 outline-none text-sm"
                             value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-xl hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 flex justify-center items-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> {editingItem ? 'Update' : 'Save'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
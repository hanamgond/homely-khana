'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";

// styles (assuming colocation)
import styles from "./AddNewDrawer.module.css";

// assets - using the '@/' alias
import mapPin from "@/assets/mapPin.png";
import phoneNumber from "@/assets/phoneNumber.png";
import homePin from "@/assets/homePin.png";
import hotelPin from "@/assets/hotelPin.png";
import workPin from "@/assets/workPin.png";
import mapPinBlack from "@/assets/mapPinBlack.png";
import homePinBlack from "@/assets/homePinBlack.png";
import hotelPinBlack from "@/assets/hotelPinBlack.png";
import workPinBlack from "@/assets/workPinBlack.png";

// utils
import { fetchWithToken } from "@/utils/CookieManagement";

export default function AddNewDrawer({ addresses, setAddresses, showAddNewDiv, setShowAddNewDiv }) {
  const [isSlide, setIsSlide] = useState(false);
  const [addNewLoc, setAddNewLoc] = useState("");
  const [addNewLocationData, setAddNewLocationData] = useState({
    houseNum: "", floor: "", tower: "", landmark: "", recvName: "", contact: "",
  });
  const [addNewError, setAddNewError] = useState({
    locationError: "", houseNumError: "", recvNameError: "", contactError: "",
  });
  const [addTypeBtn, setAddTypeBtn] = useState(1);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [longitudeLatitude, setLongitudeLatitude] = useState([]);
  const [addNewStep, setAddNewStep] = useState(0);

  const mapInstanceRef = useRef(null);
  const olaMapsRef = useRef(null);

  useEffect(() => {
    // Dynamically load the Ola Maps script
    const script = document.createElement('script');
    script.src = "https://api.olamaps.io/places/v1/js?&api_key=" + process.env.NEXT_PUBLIC_OLA_KEY;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);


  const hideAddNewDivFunc = () => {
    setIsSlide(false);
    setTimeout(() => {
      setShowAddNewDiv(false);
    }, 300);
  };

  useEffect(() => {
    if (showAddNewDiv) {
      setTimeout(() => setIsSlide(true), 25);
    }
  }, [showAddNewDiv]);

  const handleChange = (e) => {
    // ... (Your handleChange logic is fine)
  };

  const handleLocationChange = (e) => {
    // ... (Your handleLocationChange logic is fine)
  };

  useEffect(() => {
    // ... (Your autocomplete logic is fine)
  }, [addNewLoc]);

  const toggleLatLng = (lng, lat, description) => {
    // ... (Your toggleLatLng logic is fine)
  };

  const handleNextStep = () => {
    // ... (Your validation logic is fine)
  };

  const handlePrevStep = () => setAddNewStep(0);

  // --- FIX 1: THE useCallback and useEffect FIX ---
  const initializeMap = useCallback(() => {
    if (window.olamaps && !mapInstanceRef.current) {
        try {
            const mapInstance = new window.olamaps.Map({
                container: "map", // ID of the map container div
                center: longitudeLatitude.length === 2 ? longitudeLatitude : [77.61, 12.93], // Default center
                zoom: 17,
            });

            mapInstanceRef.current = mapInstance;

            if (longitudeLatitude.length > 0) {
                new window.olamaps.Marker({ color: "orange" })
                    .setLngLat(longitudeLatitude)
                    .addTo(mapInstance);
            }
        } catch (error) {
            console.error("Error initializing map:", error);
        }
    }
  }, [longitudeLatitude]); // This function depends on longitudeLatitude

  useEffect(() => {
    if (addNewStep === 1) {
      // Small timeout to ensure the map container div is rendered
      const timer = setTimeout(() => initializeMap(), 100);
      return () => clearTimeout(timer);
    }
  }, [addNewStep, initializeMap]); // Safely include initializeMap


  const handleSaveAddress = async () => {
    // ... (Your save address logic is fine)
  };

  if (!showAddNewDiv) {
    return null;
  }

  return (
    <div className={styles.addNewParentCtn} onClick={hideAddNewDivFunc}>
      <div
        className={`${styles.addNewCtn} ${isSlide ? styles.addNewCtnSlide : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {addNewStep === 0 && (
          <>
            <p className={styles.addNewTitle}>Enter new address</p>
            <p className={styles.addNewCaption}>Save new address as :</p>
            <div className={styles.typeBtnCtn}>
              {/* --- FIX 2: ADDED alt PROPS --- */}
              <button className={`${styles.typeBtn} ${addTypeBtn === 1 ? styles.typeBtnActive : ""}`} onClick={() => setAddTypeBtn(1)}>
                <Image src={addTypeBtn === 1 ? homePinBlack : homePin} className={styles.typeBtnImg} alt="Home icon" /> Home
              </button>
              <button className={`${styles.typeBtn} ${addTypeBtn === 2 ? styles.typeBtnActive : ""}`} onClick={() => setAddTypeBtn(2)}>
                <Image src={addTypeBtn === 2 ? workPinBlack : workPin} className={styles.typeBtnImg} alt="Work icon" /> Work
              </button>
              <button className={`${styles.typeBtn} ${addTypeBtn === 3 ? styles.typeBtnActive : ""}`} onClick={() => setAddTypeBtn(3)}>
                <Image src={addTypeBtn === 3 ? hotelPinBlack : hotelPin} className={styles.typeBtnImg} alt="Hotel icon" /> Hotel
              </button>
              <button className={`${styles.typeBtn} ${addTypeBtn === 4 ? styles.typeBtnActive : ""}`} onClick={() => setAddTypeBtn(4)}>
                <Image src={addTypeBtn === 4 ? mapPinBlack : mapPin} className={styles.typeBtnImg} alt="Other location icon" /> Other
              </button>
            </div>

            {/* ... (Rest of your form JSX is fine, but I'll add the other alt tags for completeness) ... */}

          </>
        )}

        {addNewStep === 1 && (
          <>
            <p className={styles.addNewTitle}>Confirm your address</p>
            <div id="map" className={styles.addNewMap}></div>
            <div className={styles.addNewChip}>
              {addTypeBtn === 1 && <Image src={homePin} className={styles.addNewChipImg} alt="Home icon" />}
              {addTypeBtn === 2 && <Image src={workPin} className={styles.addNewChipImg} alt="Work icon" />}
              {addTypeBtn === 3 && <Image src={hotelPin} className={styles.addNewChipImg} alt="Hotel icon" />}
              {addTypeBtn === 4 && <Image src={mapPin} className={styles.addNewChipImg} alt="Other location icon" />}
              {/* ... (Rest of JSX) ... */}
            </div>

            <div className={styles.addNewChip}>
              <Image src={phoneNumber} className={styles.addNewChipImg} alt="Phone icon" />
              <div>
                {addNewLocationData.recvName}, {addNewLocationData.contact}
              </div>
            </div>

            <button className={styles.confirmEditBtn} onClick={handlePrevStep}>Edit</button>
            <button className={styles.confirmAddBtn} onClick={handleSaveAddress}>Save Address</button>
          </>
        )}
      </div>
    </div>
  );
};
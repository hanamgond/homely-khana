//frontend/src/modules/marketing/components/FAQs/index.js
'use client'; 

import React, { useRef, useState } from "react";
import Image from "next/image";
import styles from "./FAQs.module.css";
import arrow from "@/assets/arrow.svg"; 

const AccordionItem = ({ question, answer, isOpen, onClick }) => {
    const contentHeight = useRef();
    
    return (
      <div className={styles.wrapper}>
        <button 
          className={`${styles.questionContainer} ${isOpen ? styles.active : ""}`} 
          onClick={onClick}
          aria-expanded={isOpen}
        >
          <p className={styles.questionText}>{question}</p>
          <span className={styles.plus}>
            {isOpen ? "−" : "+"}
          </span>
        </button>
  
        <div 
          ref={contentHeight} 
          className={styles.answerContainer} 
          style={{ 
            height: isOpen ? `${contentHeight.current.scrollHeight}px` : "0px",
            opacity: isOpen ? 1 : 0 
          }}
        >
          <div className={styles.answerContent}>{answer}</div>
        </div>
      </div>
    );
};

export default function FAQs() {
    const data = [
        { "question": "What is HomelyKhana?", "answer": "HomelyKhana is a cloud-based subscription meal provider offering fresh, homemade-style meals delivered to your doorstep." },
        { "question": "How do I subscribe to a meal plan?", "answer": "You can subscribe by signing up on our website, choosing your preferred meal plan, and completing the payment process." },
        { "question": "What meal plans do you offer?", "answer": "We offer daily, weekly, and monthly meal plans with customizable options for vegetarian, non-vegetarian, and special dietary needs." },
        { "question": "Can I customize my meals?", "answer": "Yes, you can customize your meals by selecting your preferred dishes and portion sizes during the subscription process." },
        { "question": "Do you cater to specific dietary restrictions?", "answer": "Absolutely! We provide meals for specific dietary requirements, including vegan, gluten-free, and low-calorie options." },
        { "question": "What is the delivery schedule?", "answer": "Meals are delivered daily between 11:00 AM and 1:00 PM for lunch and 6:00 PM and 8:00 PM for dinner." },
    ];

    const [activeIndex, setActiveIndex] = useState(null);

    const handleItemClick = (index) => {
        setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
    };

    return (
        <section id="faq-section" className={styles.container}>
            <div className={styles.maxWidthWrapper}>
                <h2 className={styles.title}>Frequently Asked Questions</h2>
                  <p className={styles.subtitle}>
                  Everything you need to know about our service
                  </p>
                <div className={styles.faqList}>
                    {data.map((item, index) => (
                        <AccordionItem
                            key={index}
                            question={item.question}
                            answer={item.answer}
                            isOpen={activeIndex === index}
                            onClick={() => handleItemClick(index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
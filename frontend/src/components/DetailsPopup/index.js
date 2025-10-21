import Image from 'next/image'
import React from 'react'

//styles
import styles from "../../styles/Offering.module.css"

//assets
import closeBtn from "../assets/closeBtn.svg";

const DetailsPopup = ({ items, imageSrc, details, name, trialPrice, weeklyPrice, monthlyPrice, toggleClose }) => {

  return (
    <div className={styles.viewDetailsCtn} onClick={(event) => toggleClose(event)}>
      <div className={styles.viewDetailsParent} onClick={(e) => {e.stopPropagation()}}>
        <button className={styles.closeBtn} onClick={(event) => toggleClose(event)}><Image src={closeBtn} /></button>
        <div className={styles.viewDetailsHeader}>
          <Image src={imageSrc} width={500} height={500} className={styles.viewDetailsImg} />
          <div>
            <p style={{ marginBottom: '8px' }}>{name} </p>
            <div className={styles.popUpPlanPrice}><span className={styles.popUpPlanSpan}>Monthly Plan</span>: ₹ {monthlyPrice} /- Per Meal</div>
            <div className={styles.popUpPlanPrice}><span className={styles.popUpPlanSpan}>Weekly Plan</span>: ₹ {weeklyPrice} /- Per Meal</div>
            <div className={styles.popUpPlanPrice}><span className={styles.popUpPlanSpan}>Trial Plan</span>: ₹ {trialPrice} /- Per Meal</div>
          </div>
        </div>

        <div className={styles.tableCtn}>
          <div className={styles.tableCell}>
            <p className={styles.tableCellLeft}>Item</p>
            <p className={styles.tableCellRight}>Quantity</p>
          </div>
          {items.map((item, index) => (
            <div className={styles.tableCell} key={index}>
              <p className={styles.tableCellLeft}>{item}</p>
              <p className={styles.tableCellRight}>{details[index]}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default DetailsPopup
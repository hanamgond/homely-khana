import React from 'react'

//styles
import styles from "./ProgressBar.module.css"

const ProgressBarSubscribe = ({currStep = 2}) => {
  return (
    <div className={styles.progressWrapper}>
      <div className={`${styles.progressItem} ${currStep > 0 ? styles.completed : ''} ${currStep == 0 ? styles.active : ''}`}>
            <div className={styles.progressCounter}>1</div>
            <div className={styles.progressName}>Choose Your Meal</div>
        </div>

        <div className={`${styles.progressItem} ${currStep > 1 ? styles.completed : ''} ${currStep == 1 ? styles.active : ''}`}>
            <div className={styles.progressCounter}>2</div>
            <div className={styles.progressName}>Build Your Subscription</div>
        </div>

        <div className={`${styles.progressItem} ${currStep > 2 ? styles.completed : ''} ${currStep == 2 ? styles.active : ''}`}>
            <div className={styles.progressCounter}>3</div>
            <div className={styles.progressName}>Select Delivery Address</div>
        </div>

        <div className={`${styles.progressItem} ${currStep > 3 ? styles.completed : ''} ${currStep == 3 ? styles.active : ''}`}>
            <div className={styles.progressCounter}>4</div>
            <div className={styles.progressName}>Payment</div>
        </div>
    </div>
  )
}

const ProgressBarOrderStatus = ({currStep = 0}) => {
  return (
    <div className={styles.progressWrapperOrder}>
      <div className={`${styles.progressItemOrder} ${currStep > 0 ? styles.completedOrder : ''} ${currStep == 0 ? styles.active : ''}`}>
            <div className={styles.progressCounterOrder}></div>
            <div className={styles.progressName}>Order Received</div>
        </div>

        <div className={`${styles.progressItemOrder} ${currStep > 1 ? styles.completedOrder : ''} ${currStep == 1 ? styles.active : ''}`}>
            <div className={styles.progressCounterOrder}></div>
            <div className={styles.progressName}>In Kitchen</div>
        </div>

        <div className={`${styles.progressItemOrder} ${currStep > 2 ? styles.completedOrder : ''} ${currStep == 2 ? styles.active : ''}`}>
            <div className={styles.progressCounterOrder}></div>
            <div className={styles.progressName}>Ready For Pick-up </div>
        </div>

        <div className={`${styles.progressItemOrder} ${currStep > 3 ? styles.completedOrder : ''} ${currStep == 3 ? styles.active : ''}`}>
            <div className={styles.progressCounterOrder}></div>
            <div className={styles.progressName}>Out for Delivery</div>
        </div>
    </div>
  )
}

export {ProgressBarOrderStatus , ProgressBarSubscribe}
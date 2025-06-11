"use client";

import React, { useState } from 'react';

export default function OrderForm({insertOrder, menuList, logOutGuest, loggedGuestId}) {

const [pickedDish, setPickedDish] = useState("");


function handleSubmit(e){
  e.preventDefault();

  insertOrder(pickedDish);
}

  return (
    <form onSubmit={handleSubmit} className="controls">
        {menuList.map((dish) => (
          <label key={dish.id} className='dishOptions'><span>{dish.name}</span><input type="radio" onChange={(e) => {setPickedDish(e.target.value)}} name="pickedDish" value={dish.id} /></label>
        ))}
        <br />
      <button className="order" type="submit">Order</button>
      {loggedGuestId && (
        <button type="button" className="logOut" onClick={logOutGuest}>
          Leave table
        </button>)}
    </form>
    
  )
}


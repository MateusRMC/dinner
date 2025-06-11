"use client";

import React, { useState } from 'react';

export default function OrderForm({insertOrder, fetchMenu, menuList, logOutGuest, loggedGuestId}) {

const [dishOption, setDishOption] = useState("");

  return (
    <form onSubmit={insertOrder} className="controls">
        {menuList.map((dish) => (
          <label key={dish.id} className='dishOptions'><span>{dish.name}</span><input type="radio" name="pickledDish" /></label>
        ))}
        <br />
      <button className="order" type="submit">Order</button>
      {loggedGuestId && (
        <button className="logOut" onClick={logOutGuest}>
          Leave table
        </button>)}
    </form>
    
  )
}


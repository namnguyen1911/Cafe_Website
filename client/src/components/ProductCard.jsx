import React from 'react'
import { assets } from '../assets/assets';
import { useAppContext } from '../context/AppContext';

const ProductCard = ({product}) => {
    const {currency, addToCart, removeFromCart, cartItems, navigate} = useAppContext()

    return product && (
        <div onClick={() => {navigate(`/products/${product.category.toLowerCase()}/${product._id}`); scrollTo(0,0)}} className="border border-gray-500/20 rounded-md md:px-4 px-3 py-2 bg-white min-w-56 max-w-56 w-full">
            {/**Image*/}
            <div className="group cursor-pointer">
                <div className="w-full aspect-square overflow-hidden rounded bg-white border border-gray-200 flex items-center justify-center">
                    <img className="w-full h-full object-cover transition-transform group-hover:scale-105" src={product.image[0]} alt={product.name} />
                </div>
            </div>
            {/**Information*/}
            <div className="text-gray-500/60 text-sm">
                {/**Category*/}
                <p>{product.category}</p>
                {/**Name of products*/}
                <p className="text-gray-700 font-medium text-lg truncate w-full">{product.name}</p>
                {/**Ratings*/}
                <div className="flex items-center gap-0.5">
                    {Array.from({length: 5},(_,i) => (
                        <img key={i} className='md:3-5 w-3' src={i<4 ? assets.star_icon: assets.star_dull_icon}/>
                        
                    ))}
                    <p>(4)</p>
                </div>
                <div className="flex items-end justify-between mt-3">
                    {/**Prices*/}
                    <p className="md:text-xl text-base font-medium text-primary">
                        {currency}{product.offerPrice}{" "} <span className="text-gray-500/60 md:text-sm text-xs line-through">{currency}{product.price}</span>
                    </p>
                    {/**Add to cart*/}
                    <div onClick={(e) => {e.stopPropagation(); {/**Stop navigating when click on add to card or + or -*/}} } className="text-primary">
                        {!cartItems[product._id] ? (
                            <button className="flex items-center justify-center gap-1 bg-primary/10 border border-primary/40 md:w-20 w-16 h-[34px] rounded cursor_pointer" onClick={() => addToCart(product._id)} >
                                <img src={assets.cart_icon}/>
                                Add
                            </button>
                        ) : (
                            <div className="flex items-center justify-center gap-2 md:w-20 w-16 h-[34px] bg-primary/25 rounded select-none">
                                <button onClick={() => {removeFromCart(product._id)}} className="cursor-pointer text-md px-2 h-full" >
                                    -
                                </button>
                                <span className="w-5 text-center">{cartItems[product._id]}</span>
                                <button onClick={() => addToCart(product._id)} className="cursor-pointer text-md px-2 h-full" >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;

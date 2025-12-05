import { NavLink } from 'react-router-dom'
import React, {useEffect} from 'react'
import {assets} from '../assets/assets'
import {useAppContext} from '../context/AppContext.jsx'
import toast from 'react-hot-toast'

const Navbar = () => {
    const [open, setOpen] = React.useState(false)
    const {user, setUser, setShowUserLogin, navigate, setSearchQuery, searchQuery, getCartCount, axios, setCartItems} = useAppContext()
    const logout = async () => {
        try {
            const {data} = await axios.post('/api/user/logout')
            if(data.success) {
                setUser(null)
                setCartItems({})
                toast.success(data.message)
                navigate('/')
            }
            else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
        
    }
    useEffect(() => {
        if(searchQuery.length > 0) {
            navigate("/products")
        }
    },[searchQuery])
  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4 border-b border-gray-300 bg-white relative transition-all z-30">

            {/* Logo */}
            <NavLink to='/' onClick={() => setOpen(false)} >

                <img className="h-20" src={assets.logo} alt="logo"/>

            </NavLink>


            {/* Desktop Menu */}

            <div className="hidden sm:flex items-center gap-8">

                <NavLink to='/'>Home</NavLink>

                <NavLink to='/products'>All Product</NavLink>

                <NavLink to='/'>Contact</NavLink>

                {/* Search bar */}
                <div className="hidden lg:flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full">

                    <input onChange={(e) => {setSearchQuery(e.target.value)}} className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500" type="text" placeholder="Search products" />

                    <img src={assets.search_icon} alt='search' className='w-4 h-4'/>

                </div>

                {/* Cart */}
                <div onClick={() => navigate("/cart")} className="relative cursor-pointer">

                    <img src={assets.nav_cart_icon} alt='cart' className='w-6 opacity-80'/>

                    <button  className="absolute -top-2 -right-3 text-xs text-white bg-red-400 hover:bg-red-600 w-[18px] h-[18px] rounded-full">{getCartCount()}</button>

                </div>

                {/* Login/Sign up */}
                {!user ? (<button onClick={() => setShowUserLogin(true)} className="cursor-pointer px-8 py-2 bg-primary hover:bg-primary-dull transition text-white rounded-full">

                    Login

                </button>) :
                (
                    <div className='relative group'>
                        <img src={assets.profile_icon} className='w-10' alt="profile_icon"/>
                        <ul className='hidden group-hover:block absolute top-10 right-0 bg-white shadow border border-gray-230 py-2.5 w-30 rounded-md text-sm z-40'>
                            <li onClick={() => navigate("my-orders")} className='p-1.5 pl-3 hover:bg-primary/10 cursor-pointer'>My Orders</li>
                            <li onClick={logout} className='p-1.5 pl-3 hover:bg-primary/10 cursor-pointer'>Logout</li>
                        </ul>
                    </div>
                )}

            </div>

            <div className="flex items-center gap-6 sm:hidden">
                {/* Cart */}
                <div onClick={() => navigate("/cart")} className="relative cursor-pointer">

                    <img src={assets.nav_cart_icon} alt='cart' className='w-6 opacity-80'/>

                    <button  className="absolute -top-2 -right-3 text-xs text-white bg-red-400 hover:bg-red-600 w-[18px] h-[18px] rounded-full">{getCartCount()}</button>

                </div>

                <button onClick={() => setOpen(!open)} aria-label="Menu" >

                    {/* Menu Icon SVG */}

                    <img src={assets.menu_icon} alt='menu'/>

                </button>
            </div>


            


            {/* Mobile Menu */}

            {open && (<div className='fixed top-0 bottom-0 left-0 right-0 z-30' onClick={() => setOpen(false)}>
                <div onClick={(e) => e.stopPropagation()} className={`${open ? 'flex' : 'hidden'} absolute top-20 right-5 w-30 bg-white shadow-md py-4 flex-col items-start gap-2 px-5 text-sm md:hidden z-40`}>

                    <NavLink to='/' onClick={() => setOpen(false)}>Home</NavLink>

                    <NavLink to='/products' onClick={() => setOpen(false)}>All Products</NavLink>

                    { user && <NavLink to='/products' onClick={() => setOpen(false)}>My Orders</NavLink>}

                    <NavLink to='/' onClick={() => setOpen(false)}>Contact</NavLink>

                    {!user ? (
                        //Login
                        <button onClick={() => {setOpen(false);setShowUserLogin(true)}} className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary-dull transition text-white rounded-full text-sm">

                            Login

                        </button>) : (
                        //Logout
                        <button onClick={logout} className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary-dull transition text-white rounded-full text-sm">

                            Logout

                        </button>
                    )}
                </div>
            </div>)}


        </nav>
  )
}

export default Navbar

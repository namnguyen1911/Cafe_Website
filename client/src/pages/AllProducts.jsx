import React from 'react'
import { useAppContext } from '../context/AppContext'

const AllProducts = () => {

    const {products} = useAppContext()
  return (
    <div className='mt-16 flex flex-col'>
        <div>
            <p>All products</p>
            <div className='w-16 h-0.5 bg-primary rounded-full'></div>
        </div>
        
    </div>
  )
}

export default AllProducts
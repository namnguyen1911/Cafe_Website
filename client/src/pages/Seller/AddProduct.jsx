import React, { useEffect, useState } from 'react'
import { assets, categories } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

const AddProduct = () => {

  const [files, setFiles] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [existingImages, setExistingImages] = useState([]);

  const {axios, navigate, fetchProducts} = useAppContext()
  const {id} = useParams()
  const isEdit = Boolean(id)

  useEffect(() => {
    if(!isEdit) return;
    const load = async () => {
        try {
            const {data} = await axios.get(`/api/product/${id}`);
            if(data.success) {
                const p = data.product;
                setName(p.name || '');
                setDescription(Array.isArray(p.description) ? p.description.join('\n') : p.description || '');
                setCategory(p.category || '');
                setPrice(p.price || '');
                setOfferPrice(p.offerPrice || '');
                setExistingImages(p.image || []); // use a separate state for existing image previews
            }
            else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        };
    }
    load();
  },[isEdit,id,axios])

  const onSubmitHandler = async (event) => {
    try {
        {/* Stop page loading */}
        event.preventDefault();

        const productData = {
            name,
            description: description.split('\n'),
            category,
            price,
            offerPrice,
            retainImages: existingImages,
        }

        const formData = new FormData();
        formData.append('productData',JSON.stringify(productData));
        for (let index = 0; index < files.length; index++) {
            formData.append('images',files[index])
        }


        const response = isEdit 
            ? await axios.put(`/api/product/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }})
            : await axios.post('/api/product/add', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
        const { data } = response;

        if (data.success) {
            await fetchProducts();
            toast.success(data.message);
            setName('')
            setDescription('')
            setCategory('')
            setPrice('')
            setOfferPrice('')
            setFiles([])
            navigate('/seller/product-list')
        } else {
            toast.error(data.message)
        }
    } catch (error) {
        toast.error(error.message)
    }
  }

  return (
    <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex flex-col justify-between">

            <form onSubmit={onSubmitHandler} className="md:p-10 p-4 space-y-5 max-w-lg">

                <div>

                    <p className="text-base font-medium">Product Image</p>

                    <div className="flex flex-wrap items-center gap-3 mt-2">

                        {Array(4).fill('').map((_, index) => (

                            <label key={index} htmlFor={`image${index}`}>

                                <input onChange={(e) => {
                                  const updatedFiles = [...files];
                                  updatedFiles[index] = e.target.files[0]
                                  setFiles(updatedFiles)
                                }} accept="image/*" type="file" id={`image${index}`} hidden />

                                <div className="w-24 h-24 border rounded overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer">
                                  <img
                                    className="w-full h-full object-cover"
                                    src={files[index] ? URL.createObjectURL(files[index]) : (existingImages[index] || assets.upload_area)}
                                    alt="uploadArea"
                                  />
                                </div>

                            </label>

                        ))}

                    </div>

                </div>

                <div className="flex flex-col gap-1 max-w-md">

                    <label className="text-base font-medium" htmlFor="product-name">Product Name</label>

                    <input onChange={(e) => setName(e.target.value)} value={name}
                    id="product-name" type="text" placeholder="Type here" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" required />

                </div>

                <div className="flex flex-col gap-1 max-w-md">

                    <label className="text-base font-medium" htmlFor="product-description">Product Description</label>

                    <textarea onChange={(e) => setDescription(e.target.value)} value={description}
                    id="product-description" rows={4} className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none" placeholder="Type here"></textarea>

                </div>

                <div className="w-full flex flex-col gap-1">

                    <label className="text-base font-medium" htmlFor="category">Category</label>

                    <select onChange={(e) => setCategory(e.target.value)} value={category}
                    id="category" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40">

                        <option value="">Select Category</option>

                        {categories.map((item, index) => (
                          <option key={index} value={item.path}>{item.path}</option>
                        ))}

                    </select>

                </div>

                <div className="flex items-center gap-5 flex-wrap">

                    <div className="flex-1 flex flex-col gap-1 w-32">

                        <label className="text-base font-medium" htmlFor="product-price">Product Price</label>

                        <input onChange={(e) => setPrice(e.target.value)} value={price}
                        id="product-price" type="number" placeholder="0" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" required />

                    </div>

                    <div className="flex-1 flex flex-col gap-1 w-32">

                        <label className="text-base font-medium" htmlFor="offer-price">Offer Price</label>

                        <input onChange={(e) => setOfferPrice(e.target.value)} value={offerPrice}
                        id="offer-price" type="number" placeholder="0" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" required />

                    </div>

                </div>

                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => navigate('/seller/product-list')}
                    className="flex-1 py-2.5 bg-red-400 text-white font-medium rounded cursor-pointer hover:bg-red-600 text-center"
                  >
                    Cancel
                  </button>
                  <button className="flex-1 py-2.5 bg-green-500 text-white font-medium rounded cursor-pointer hover:bg-green-600 text-center">
                    {isEdit ? "EDIT" : "ADD"}
                  </button>
                </div>

            </form>

        </div>
  )
}

export default AddProduct

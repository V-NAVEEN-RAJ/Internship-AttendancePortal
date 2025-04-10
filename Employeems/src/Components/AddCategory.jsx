import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const AddCategory = () => {
    const [category, setCategory] = useState("")
    const navigate = useNavigate()

    const handleSubmit = (e) => {
        e.preventDefault()
        axios.post('https://cybernaut-attendanceportal.onrender.com/admin/add_category', {category})
        .then(result => {
            if(result.data.Status){
                navigate('/dashboard/category')
            }else{
                alert(result.data.Error)
            }
        })
        .catch(err => console.log(err))
    }

    return (
        <div 
            className="d-flex justify-content-center align-items-center vh-100"
            style={{
                backgroundImage: "white 500", // Corrected Image Path
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                overflow: "hidden" // Prevents scrolling
            }}
        >
            <div 
                className="p-4 rounded border w-100 mx-3 mx-md-0 shadow bg-grey"
                style={{ 
                    maxWidth: '400px', 
                    background: "#0D6EFD", // Mild transparent white background
                    backdropFilter: "blur(10px)" // Soft blur effect
                }}
            >
                <h2 className="text-center mb-3">Add Category</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="category"><strong>Category:</strong></label>
                        <input
                            type="text"
                            name="category"
                            placeholder="Enter Category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="form-control rounded-10 mt-2"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-success w-100 rounded-0">Add Category</button>
                </form>
            </div>
        </div>
    );
}

export default AddCategory;

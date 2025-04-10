import React, { useState, useEffect } from "react";
import axios from "axios";
import SectionHeader from './SectionHeader';

const ProfileSection = ({ e = {}, isLoading, handleEditToggle }) => {
  const [categories, setCategories] = useState({});

  useEffect(() => {
    // Update endpoint to match backend route
    axios.get("https://cybernaut-attendanceportal.onrender.com/admin/category")
      .then(result => {
        if (result.data.Status) {
          const categoryMap = result.data.Result.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
          }, {});
          setCategories(categoryMap);
        }
      })
      .catch(err => {
        console.error("Error fetching categories:", err);
        // Use empty object as fallback if categories fetch fails
        setCategories({});
      });
  }, []);

  const getDepartmentName = (categoryId) => {
    return categories[categoryId] || "No Department Assigned";
  };

  const getImageSrc = () => {
    if (e?.image_blob) {
      return `data:image/jpeg;base64,${e.image_blob}`;
    }
    return "https://cybernaut-attendanceportal.onrender.com/Images/default.png";
  };

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const profileFields = [
    { label: "Full Name", value: e?.employee_name || e?.name || "N/A" },
    { label: "Email", value: e?.email || "N/A" },
    { label: "Department", value: getDepartmentName(e?.category_id) },
    { label: "Address", value: e?.address || "N/A" },
    { label: "Salary", value: e?.salary ? `₹${e.salary}` : "N/A" },
  ];

  return (
    <div className="container mt-4">
      <SectionHeader title="Profile" />
      <div className="row">
        {/* Profile Image & Name */}
        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-body text-center">
              <img
                src={getImageSrc()}
                alt="Employee"
                className="rounded-circle img-fluid"
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  border: "3px solid #2c3e50",
                }}
                onError={(event) =>
                  (event.target.src =
                    "https://cybernaut-attendanceportal.onrender.com/Images/default.png")
                }
              />
              <h5 className="my-3">{e?.employee_name || e?.name || "N/A"}</h5>
              <p className="text-muted mb-1">
                {getDepartmentName(e?.category_id)}
              </p>
              <button
                className="btn btn-primary"
                onClick={handleEditToggle}
                aria-label="Edit Profile"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Employee Details */}
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-body">
              {profileFields.map((field, index) => (
                <React.Fragment key={index}>
                  <div className="row">
                    <div className="col-sm-3">
                      <p className="mb-0 text-muted">{field.label}</p>
                    </div>
                    <div className="col-sm-9">
                      <p className="mb-0">{field.value}</p>
                    </div>
                  </div>
                  {index < profileFields.length - 1 && <hr />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;

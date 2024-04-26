import React, { useState } from "react";

import { sidebarLinks } from "../../../data/dashboard-links";
import { logout } from "../../../services/operations/authAPI";
import { useDispatch, useSelector } from "react-redux";
import SidebarLinks from "./SidebarLinks";
import { useNavigate } from "react-router-dom";
import { VscSignOut } from "react-icons/vsc";
import ConfirmationModal from "../../common/ConfirmationModal";


const Sidebar = () => {

    const {user, loading: profileLoading} = useSelector((state) => state.profile);
    // here we extract user because we render pages according to user accounty Type 
    const {loading: authLoading} = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const[confirmationModal, setConfirmationModal] = useState(null);
    //to track the state of confirmation modal ex: cancel, logout

    if(profileLoading || authLoading){
        return ( 
            <div className="grid h-[calc(100vh-3.5rem)] min-w-[220px] items-center border-r-[1px] border-r-richblack-700 bg-richblack-800">
              <div className="spinner"></div>
            </div> 
        )
    }

    return(
        <>
            <div className="flex h-[calc(100vh-3.5rem)] min-w-[220px] flex-col border-r-[1px] border-r-richblack-700 bg-richblack-800 py-10">
                <div className="flex flex-col">
                {sidebarLinks.map((link) => {
                    if (link.type && user?.accountType !== link.type) return null
                    return (
                    <SidebarLinks key={link.id} link={link} iconName={link.icon} />
                    )
                })}
                </div>

            {/* horizontal line */}
            <div className="mx-auto mt-6 mb-6 h-[1px] w-10/12 bg-richblack-700"> </div>

            {/* settings */}
            <div className="flex flex-col">
                <SidebarLinks
                link={{ name: "Settings", path: "/dashboard/settings" }}
                iconName="VscSettingsGear"
          />

            {/* LogOut */}
            <button onClick={ () => setConfirmationModal({
                text1: "Are You Sure ?",
                text2: "You will be logged out of your account",
                btn1Text: "Logout",
                btn2Text:"Cancel",
                btn1Handler: () => dispatch(logout(navigate)),
                btn2Handler: () => setConfirmationModal(null),
            })}
            className="px-8 py-2 text-sm font-medium text-richblack-300">

                <div className="flex items-center gap-x-2">
                    <VscSignOut className="text-lg"/>
                    <span>Logout</span>
                </div>

            </button>

            </div>
            </div>  

            {/* if confirmationModal exists then add here */}
            {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
        </>
    )
}

export default Sidebar;
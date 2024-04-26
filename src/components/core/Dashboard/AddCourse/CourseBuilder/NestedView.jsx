import React from 'react'
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import {RxDropdownMenu} from "react-icons/rx";
import { MdEdit } from 'react-icons/md';
import {RiDeleteBin6Line} from "react-icons/ri";
import { BiSolidDownArrow } from 'react-icons/bi';
import {AiOutlinePlus} from "react-icons/ai";
import SubSectionModal from "./SubSectionModal";
import ConfirmationModal from "../../../../common/ConfirmationModal"

import {
  deleteSection,
  deleteSubSection,
} from "../../../../../services/operations/courseDetailsAPI"
import { setCourse } from "../../../../../slices/courseSlice"

const NestedView = (handleChangeEditSectionName) => {

  const {course} = useSelector((state) => state.course);
  const {token} = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  //flags to know in which mode we are currently in
  // States to keep track of mode of modal [add, view, edit]
  const [addSubSection, setAddSubSection] = useState(null);
  const [viewSubSection, setViewSubSection] = useState(null);
  const [editSubSection, setEditSubSection] = useState(null);

    // to keep track of confirmation modal
  const [confirmationModal, setConfirmationModal] = useState(null);

  const handleDeleteSection = async (sectionId) => {
    // delete section API CALL
      const result = await deleteSection({
        sectionId,
        courseid: course._id,
        token,
      })
      // update course
      if(result){ 
        dispatch(setCourse(result))
      }
      setConfirmationModal(null);
  }

  const handleDeleteSubSection = async (subSectionId, sectionId) => {
      //delete sub section API CALL
      const result = await deleteSubSection({
        subSectionId,
        sectionId,
        token 
      });
      if(result){
        //since we get updated section in response from API, so in order to make changes in course
        //we have to make another updatedcourse from the response we got then set course according to response
        const updatedCourseContent = course.courseContent.map((section) =>
          section._id === sectionId ? result : section);
          const updatedCourse = {...course, courseContent: updatedCourseContent}
        // kya yha aur kuch kr skte hai
          dispatch(setCourse(updatedCourse)); 
      }
      setConfirmationModal(null);
  }

  return (
    <>
        <div className='rounded-lg bg-richblack-700 p-6 px-8'
              id='nestedViewContainer'>
          {course?.courseContent?.map((section) => (
            //section dropdown
            <details key={section._id} open>
              {/* section dropdown content */}
              <summary className="flex cursor-pointer items-center justify-between border-b-2 border-b-richblack-600 py-2">
                  <div className='flex items-center gap-x-3'>
                    <RxDropdownMenu className="text-2xl text-richblack-50"/>
                    <p className='font-semibold text-richblack-50'>{section.sectionName}</p>
                  </div>
                  <div className='flex items-center gap-x-3'>
                  {/* Edit button   */}
                    <button
                      onClick={() => handleChangeEditSectionName(section._id, section.sectionName)}>
                        <MdEdit className="text-xl text-richblack-300" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        setConfirmationModal({
                          text1: "Delete this Section?",
                          text2: "All the lectures in this section will be deleted",
                          btn1Text: "Delete",
                          btn2Text: "Cancel",
                          btn1Handler: () => handleDeleteSection(section._id),
                          btn2Handler: () => setConfirmationModal(null), 
                        })
                      }}>
                       <RiDeleteBin6Line className="text-xl text-richblack-300"/>
                    </button>

                    {/* vertical line */}
                    <span className="font-medium text-richblack-300">|</span>
                    <BiSolidDownArrow className={`text-xl text-richblack-300`}/>
                  </div>
              </summary>

              {/* subsection inside section*/}
                  <div className='px-6 pb-4'>
                  {/* Render All Sub Sections Within a Section */}
                    {
                      section.subSection.map((data) =>  (
                        <div
                          key={data?._id}
                          onClick={() => setViewSubSection(data)}
                          className="flex cursor-pointer items-center justify-between gap-x-3 border-b-2 border-b-richblack-600 py-2"
                          >
                           <div className='flex items-center gap-x-3 py-2'>
                            <RxDropdownMenu className="text-2xl text-richblack-50" />
                            <p className='font-semibold text-richblack-50'>{data.title}</p>
                          </div>
                          
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className='flex items-center gap-x-3'>
                              <button
                                onClick={() => setEditSubSection({...data, sectionId:section._id})}>
                                <MdEdit className="text-xl text-richblack-300" />
                              </button>

                              <button
                                onClick={() => {
                                  setConfirmationModal({ 
                                  text1: "Delete this Sub Section?",
                                  text2: "Selected lectures will be deleted",
                                  btn1Text: "Delete",
                                  btn2Text: "Cancel",
                                  btn1Handler: () => handleDeleteSubSection(data._id,section._id),
                                  btn2Handler: () => setConfirmationModal(null),
                                })
                              }}>
                                  <RiDeleteBin6Line className="text-xl text-richblack-300"/>
                              </button>
                          </div>
                        </div>
                      ))
                    }
                    {/* Add lecture btn */}
                    <button
                      onClick={() => setAddSubSection(section._id)}
                      className='mt-3 flex items-center gap-x-1 text-yellow-50'>
                      <AiOutlinePlus className='text-lg'/>
                      <p>Add Lecture</p>
                    </button>
                  </div>
            </details>
          ))}
        </div>

          {/* Now Show Modal according to btn click  */}
          {/* Modal data is for the video that we want to add and set modal is fn to set data */}
          {
            addSubSection ? (<SubSectionModal
              modalData={addSubSection}
              setModalData={setAddSubSection}
              add={true}  //flag value
               />)
            : viewSubSection ? (<SubSectionModal
              modalData={viewSubSection}
              setModalData={setViewSubSection}
              view={true} //flag value
               />)
            : editSubSection ? (<SubSectionModal
              modalData={editSubSection}
              setModalData={setEditSubSection}
              edit={true} //flag value
              />)
            : (<div></div>)
          }

          {/* Render Confirmation modal */}
          {confirmationModal ?
              {/* if data is present in confirmation modal then render */}
            (
              <ConfirmationModal modalData={confirmationModal}/>
            )
            : (<></>)
          }
    </>
  )
}

export default NestedView
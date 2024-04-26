import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import IconBtn from '../../../../common/IconBtn';
import {MdAddCircleOutline} from "react-icons/md";
import { useDispatch, useSelector } from 'react-redux';
import {BiRightArrow} from "react-icons/bi";
import { setCourse, setEditCourse, setStep } from '../../../../../slices/courseSlice';
import { toast } from 'react-hot-toast';
import NestedView from './NestedView';
import { createSection, updateSection } from "../../../../../services/operations/courseDetailsAPI"

const CourseBuilderForm = () => {

    //required for useform hook
    const {register, handleSubmit, setValue, formState:{errors}} = useForm();

    // flag for btn toggling
    const [editSectionName, setEditSectionName] = useState(null);
    //fetch course from course slice
    const {course} = useSelector((state) => state.course);
    const dispatch = useDispatch();
    const {token} = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);

    // handle form submission
    const onSubmit = async (data) => {
        setLoading(true);
        let result;

        if(editSectionName){
            //we are editing the section Name
            result = await updateSection(
                {
                    sectionName: data.sectionName,
                    sectionId: editSectionName,
                    courseId: course._id,
                },token)
        }
        else{
            //we are creating new course
            result = await createSection(
                {
                    sectionName: data.sectionName,
                    courseId: course._id,
                },token)
        }

        //update values
        if(result){
            dispatch(setCourse(result));
            setEditSectionName(null);
            setValue("sectionName","");
        }
         setLoading(false); 
    }

    const cancelEdit = () => {
        setEditSectionName(null); //Again mark null editSection
        setValue("sectionName",""); //since we are using form hook so we have to set its value empty
    }

    const goBack = () => {
        dispatch(setStep(1));
        dispatch(setEditCourse(true));
    }

    const goToNext = () => {
        if(course.courseContent.length === 0){
            toast.error("Please add atleast one Section");
            return;
        }
        if(course.courseContent.some((section) => section.subSection.length === 0)){
            toast.error("Please add atleast one lecture in each section");
            return;
        }
        //if all well then go to next step
        dispatch(setStep(3));
    }

    //Nested view Edit btn is editing the builder section 
    const handleChangeEditSectionName = (sectionId, sectionName) => {
        if(editSectionName === sectionId){
            cancelEdit();
            return;
        }
        setEditSectionName(sectionId);
        setValue("sectionName", sectionName);
    }

  return (
    <div className="space-y-8 rounded-md border-[1px] border-richblack-700 bg-richblack-800 p-6">
        <p className="text-2xl font-semibold text-richblack-5">Course Builder</p>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div className="flex flex-col space-y-2">
                <label className="text-sm text-richblack-5" htmlFor='sectionName'>Section name <sup className='text-pink-200'>*</sup></label>
                <input
                    id='sectionName'
                    disabled={loading} 
                    placeholder='Add Section name'
                    {...register("sectionName", {required:true})}
                    className='form-style w-full'
                />
                {
                    errors.sectionName && (
                        <span className="ml-2 text-xs tracking-wide text-pink-200">Section Name is required</span>
                    )
                }
            </div>

            {/* create Section Btn */}
            <div className='flex items-end gap-x-4' > 
                <IconBtn
                   type="Submit"
                    // btn is togging b/w create Section & Edit section so we create a flag for dependency
                   disabled={loading} 
                   text={editSectionName ? "Edit Section Name" : "Create Section"}
                   outline={true}
                   customClasses={"text-white"} 
                    >
                    <MdAddCircleOutline className='text-yellow-50' size={20} />
                    </IconBtn>

                    {/* canceledit btn */}
                    {editSectionName && (
                        <button
                        type='button'
                        onClick={cancelEdit}
                        className='text-sm text-richblack-300 underline'>
                            CancelEdit
                        </button>
                    )}
            </div>
        </form>

        {/* Nested View */}
        {
            course.courseContent.length > 0 && (
                <NestedView handleChangeEditSectionName={handleChangeEditSectionName} />
            )
        }
        {/* Next & Prev Button */}
        <div className='flex justify-end gap-x-3'>
            <button onClick={goBack}
            className={`flex cursor-pointer items-center gap-x-2 rounded-md bg-richblack-300 py-[8px] px-[20px] font-semibold text-richblack-900`}>
                Back
            </button>
            <IconBtn 
            disabled={loading}
            text="Next"
            onclick={goToNext}>
                <BiRightArrow />
            </IconBtn>
        </div>
    </div>
  )
}

export default CourseBuilderForm
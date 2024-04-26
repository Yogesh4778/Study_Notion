import React, { useEffect } from 'react'
import { useState } from 'react'
import { useSelector } from 'react-redux';


export default function  RequirementField ({name, label, register, errors, setValue, getValues})
 {
    const { editCourse, course } = useSelector((state) => state.course)
    const[requirement, setRequirement] = useState("");
    // for requirements
    const[requirementList, setRequirementList] = useState([]);
    //addition or removal of requirements  is handled by this(↑) state variable

    // register on first render
    useEffect(() => {
        if (editCourse) {
            setRequirementList(course?.instructions)
          }
        register(
            name,{
            required:true,
            validate: (value) => value.length > 0}
        )
    },[]);

    //update values when value is change in form
    //when the req. list is updated we have to update values
    useEffect(() => {
        setValue(name, requirementList);
    }, [requirementList]);

    const handleAddRequirement = () => {
        if(requirement){
            setRequirementList([...requirementList, requirement]); //add requirement followed by old requirement
            setRequirement(""); //set new requirement null after addition in req. list
        }
    }

    const handleRemoveRequirement = (index) => {
        const updatedRequirementList = [...requirementList]; //cpy in new list
        updatedRequirementList.splice(index, 1); //delete requirement of given index
        setRequirementList(updatedRequirementList); //add updated list in req.list
    }
    
    return (
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-richblack-5" htmlFor={name}>
            {label} <sup className="text-pink-200">*</sup>
          </label>
          <div className="flex flex-col items-start space-y-2">
            <input
              type="text"
              id={name}
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              className="form-style w-full"
            />
            <button
              type="button"
              onClick={handleAddRequirement}
              className="font-semibold text-yellow-50"
            >
              Add
            </button>
          </div>
          {requirementList.length > 0 && (
            <ul className="mt-2 list-inside list-disc">
              {requirementList.map((requirement, index) => (
                <li key={index} className="flex items-center text-richblack-5">
                  <span>{requirement}</span>
                  <button
                    type="button"
                    className="ml-2 text-xs text-pure-greys-300 "
                    onClick={() => handleRemoveRequirement(index)}
                  >
                    clear
                  </button>
                </li>
              ))}
            </ul>
          )}
          {errors[name] && (
            <span className="ml-2 text-xs tracking-wide text-pink-200">
              {label} is required
            </span>
          )}
        </div>
      )
    }
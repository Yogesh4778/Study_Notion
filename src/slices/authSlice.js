import {createSlice} from "@reduxjs/toolkit";


const initialState = {
    // The data remains in the local storage even after turning it off or closing the browser, so it is saved in the local storage.
    signupData: null,
    loading: false,
    token: localStorage.getItem("token") ? JSON.parse(localStorage.getItem("token")) : null,
};

const authSlice = createSlice({
    name:"auth",
    initialState: initialState,
    reducers: {
        setSignupData(state, value) {
            state.signupData = value.payload;
        },
        setLoading(state, value){
            state.loading = value.payload;
        },
        setToken(state, value){
            state.token = value.payload;
        },
    },
});
 
export const {setSignupData, setLoading, setToken} = authSlice.actions;
export default authSlice.reducer;
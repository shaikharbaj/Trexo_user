"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/app/Redux/features/auth/authSlice";
import { useRouter } from "next/navigation";
import styles from '../auth.module.css'
import Link from "next/link";
import { errortoast, successtoast } from "@/utils/toastalert/alerttoast";
export default function login() {
    const dispatch = useDispatch();
    const { push } = useRouter();
    const [value, setValue] = useState({
        email: "",
        password: "",
    });

    const InputchangeHandler = (e) => {
        setValue((prev) => {
            return { ...prev, [e.target.name]: e.target.value };
        });
    };

    const SubmitHandler = async (event) => {
        event.preventDefault();
        try {
            const payload = {
                email: value.email,
                password: value.password
            }
            const response = await axios.post("http://localhost:8000/user/login_user", payload);
            const data = await response.data;
            if (data?.token) {
                dispatch(setCredentials(data));
                push("/dashboard/home");

            }
            successtoast('user logged in successfully');
        } catch (error) {
            errortoast(error.response.data.message || error);
        }
    };


    return (
        <>
            <div className={styles.background}>
                <div className={styles.shape}></div>
                <div className={styles.shape}></div>
            </div>
            <form className={styles.form} onSubmit={SubmitHandler}>
                <h3>Login Here</h3>

                <label htmlFor="email">Email</label>
                <input type="email" placeholder="Email" id="email" name="email"
                    value={value.email}
                    onChange={InputchangeHandler} />

                <label htmlFor="password">Password</label>
                <input type="password" placeholder="Password" id="password" name="password"
                    value={value.password}
                    onChange={InputchangeHandler} />

                <button >Log In</button>
                <div className={styles.alreadyhave}>
                    <p>Not have an  account? <Link href={"/register"}>Register</Link></p>
                </div>
            </form>
        </>
    );
}

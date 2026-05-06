import bcrypt from "bcrypt"

async function function_decrypt(password){
    try{    
        const hashed_password = await bcrypt.hash(password, 10)

        return hashed_password;
    }catch(error){
        console.log(error)
    }
}

async function comparePassword(password, hashed_password) {
    try{
        return await bcrypt.compare(password, hashed_password)
    }catch(error){
        console.log("Error with compare password")
    }
}

export {function_decrypt, comparePassword}
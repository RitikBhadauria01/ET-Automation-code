import jwt from "jsonwebtoken"
import catchAsync from "../helpers/catchAsync";
import ResponseObject from "../helpers/responseObjectClass";
import config from '../../config/env';
import axios from "axios";

const checkHookConnection = catchAsync(async (req, res, next) => {
console.log("checkHookConnection",req.headers)
console.log("checkHookConnection11",config)
jwt.verify(req.headers['authorization'],config.SECRET_KEY,(err,res1)=>{
    if(err){
        console.log("checkHookConnectionerr",err)
        next(err)
    }else{
        res.send(new ResponseObject(200, 'Connection Successfull', true, []));
    }
})
})
const checkAzureHookConnection = catchAsync(async (req, res, next) => {
console.log("checkHookConnection",req.headers)
console.log("checkHookConnection11",config)
jwt.verify(req.headers['authorization'],config.SECRET_KEY,(err,res1)=>{
    if(err){
        console.log("checkHookConnectionerr",err)
        next(err)
    }else{
        axios.get(config.AZUREURI,{headers:{authorization:'Basic '+config.SECRET_AZURE_KEY+''}}).then((res)=>{
            console.log("checkHookConnectionerr",res)
            res.send(new ResponseObject(200, 'Connection Successfull', true, res.data));
        }).catch((err)=>{
            console.log("checkHookConnectionerr",err)
                next(err)
        })
    }
})
})
export default {checkHookConnection,checkAzureHookConnection}

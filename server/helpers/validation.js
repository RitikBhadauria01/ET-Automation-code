import AppError from './AppError';

export default async function userValdations(userData, userField) {
    //console.log('filed value ----------' ,userData ,'field name  --',userField)
    if (userData != false && userData != true) {
    //console.log('filed value ----------' ,userData ,'field name  --',userField)
        if (userData == "") {
            //  console.log('filed value ----------' ,userData ,'field name  --',userField)
            return new AppError(`${userField} is missing in request`,404);
        }
        else {
            return true;
        }
    } else {
        return true;
    }
    
}
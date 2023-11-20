import AppError from './AppError';

export default async function userValdations(userData, userField) {
    if (userData != true) {
        if (userData == "") {
            return new AppError(`${userField} is missing in request`,404);
        }
        else {
            return true;
        }
    } else {
        return true;
    }
    
}


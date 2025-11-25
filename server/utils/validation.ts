
export const validateID = (param: any): boolean => {

    const id = parseInt(param);

    if (isNaN(id)) {
        return false;
    }

    return true;
}

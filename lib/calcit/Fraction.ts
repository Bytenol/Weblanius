class Fraction {

    constructor(
        public num: number,
        public denom: number
    ) {
        if(denom === 0)
            throw new Error("Undefined fraction is not")
    }
}
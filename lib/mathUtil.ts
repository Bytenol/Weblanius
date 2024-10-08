export const randRange = (min: number, max: number) => {
    return Math.random() * (max - min + 1) + min;
}


export const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);


export const gcdList = (lst: number[]) => {
    let _gcd = -1;
    for(let i = 0; i < lst.length - 1; i++) if(_gcd !== 1) _gcd = gcd(lst[i], lst[i + 1]);
    return _gcd;
};


export const permutator = (inputArr: number[]) => {
    let result: number[][] = [];
    const permute = (arr: number[], m: number[] = []) => {
        if (arr.length === 0) {
            result.push(m)
        } else {
            for (let i = 0; i < arr.length; i++) {
                let curr = arr.slice();
                let next = curr.splice(i, 1);
                permute(curr.slice(), m.concat(next))
            }
        }
    }
    permute(inputArr)
    return result;
};


const vector = (() => {

    /**
     * Multiply a vector by a scalar number
     * @param s is the scaling factor
     * @param v is the vector
     * @returns {*[]}
     */
    const multiplyScalar = (s: number, v: number[]) => {
        let res = [];
        for(let i = 0; i < v.length; i++) res.push(s * v[i]);
        return res;
    };

    const subtract = (v1: number[], v2: number[]) => {
        let res = [];
        for(let i = 0; i < v1.length; i++) res.push(v1[i] - v2[i]);
        return res;
    }

    return { multiplyScalar, subtract };

})();



/***
 * This function uses augmented matrix to perform some series of operations
 * @param m is the matrix
 * @param coeff is the rightmost column of the matrix
 * @type {function(*, *): {reduceEchelon: function(): {aug: [], matrix: *, coeff: *}, toString: function(): string}}
 */
const matrix = ((m: number[][], coeff: number[]) => {

    let rowLength = m.length;
    let columnLength = m[0].length;


    const getTriangleLoc = (columnNo: number) => {
        const upper: any[] = [], lower: any[] = [];

        for(let j = 0; j < 2; j++) {
            const startPt = j === 0 ? columnNo + 1 : 0;
            const endPt = j === 0 ? rowLength : columnNo;
            const cont = j === 0 ? lower : upper;
            for(let k = startPt; k < endPt; k++) {
                const val = m[k][columnNo];
                if( val !== 0) cont.push({ row: k, col: columnNo, val});
            }
        }

        return { upper: upper.reverse(), lower };
    };


    const resolveRow = () => {
        const indices = new Array(m.length).fill(0).map((i, j) => i += j);

        let isSolved = true;
        const perms = permutator(indices);

        for(let i = 0; i < perms.length; i++) {
            isSolved = true;
            const perm = perms[i];
            let d: any[] = [];
            perm.forEach(p => d.push( m[p]) );
            for(let i = 0; i < d.length; i++) {
                const g = d[i][i];
                if(g === 0) {
                    isSolved = false;
                    break;
                }
            }

            if(isSolved) {
                let cCoeff = [...coeff];
                perm.forEach((p, i) => {
                    coeff[i] = cCoeff[p];
                });
                m = d;
                break;
            }
        }

        if(!isSolved) throw new Error("Diagonal not valid");
    };


    const toString = () => {
        let str = "";
        for(let i = 0; i < m.length; i++) {
            for(let j = 0; j < m[i].length; j++) str += " " + m[i][j] + " ";
            str += "|" + coeff[i];
            str += "\n";
        }
        return str;
    }


    const reduceEchelon = () => {

        for(let i = 0; i < columnLength; i++) {

            // rearrange row to resolve zero
            for(let i = 0; i < columnLength; i++) {
                if(!m[i]) {
                    // console.log("A Fatal error has occured");
                    return;
                }
                const g = m[i][i];
                if(g === 0) resolveRow();
            }

            const {lower, upper} = getTriangleLoc(i);
            const iterable = [...lower, ...upper];

            for(let j = 0; j < iterable.length; j++) {
                const data = iterable[j];
                const pivotMatrix = [...m[data.col], coeff[data.col]];
                const itemMatrix = [...m[data.row], coeff[data.row]];
                const m1 = vector.multiplyScalar(itemMatrix[data.col], pivotMatrix);
                const m2 = vector.multiplyScalar(pivotMatrix[data.col], itemMatrix);
                const nm = vector.subtract(m1, m2);
                coeff[data.row] = nm.splice(columnLength, 1)[0];
                m[data.row] = nm;
            }
        }

        // reduction to echelon form
        const diagVal = [];
        for(let i = 0; i < columnLength; i++) {
            const v = m[i][i];
            diagVal[i] = Math.abs(v);
            const inf = 1 / v;
            m[i] = vector.multiplyScalar(inf, m[i]);
            coeff[i] *= inf;
        }

        const mx = Math.max(...diagVal);

        let aug = [...coeff].splice(0, columnLength).map(i => i *= mx);
        aug.push(mx);

        aug = aug.map(i => Math.abs(i));

        // reduce to the minimum coeff
        let gcd = Math.min(...aug);
        aug = aug.map(i => i /= gcd);
        let hasFraction = aug.some((i: any) => !(parseInt(i) !== i));
        if(hasFraction) aug = aug.map(i => i *= 2);

        gcd = gcdList(aug);
        aug = aug.map(i => i /= gcd);

        return { matrix: m, coeff, aug };
    };


    return { reduceEchelon, toString };

});
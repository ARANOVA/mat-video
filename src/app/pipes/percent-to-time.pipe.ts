import { Pipe, PipeTransform } from '@angular/core';


/**
 * Left pad a string
 *
 * @param {string} n string or number to pad
 * @param {number} width length to pad
 * @param {string} z fill character
 * @returns string
 */
const pad = (n: any, width = 2, z = '0'): string => {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


const countDecimals = (value) => {
    if (Math.floor(value) === value) {
      return 0;
    }
    return value.toString().split('.')[1].length || 0;
  }
  
  const roundFn = (number, increment, offset) => {
    const dec = 10 ** countDecimals(increment);
    return (Math.round(Math.round((number - offset) / increment) * increment * dec) / dec) + offset;
  }

@Pipe({
    name: 'percentToTime'
})
export class PercentToTimePipe implements PipeTransform {

    private formatValue(value: string | null | any): string {
        if (value !== null) {
            const time = Math.floor(parseFloat(value));
            value = value.toString().replace(/,/g, '.');
            const aux = value.split('.');
            const remainder = Math.floor(Math.round(parseFloat(aux.length > 1 ? pad(aux[1]) : '0') * 100) / 100);
            // console.log("remainder", parseFloat(value), parseFloat(aux.length > 1 ? pad(aux[1]) : '0') * 100, remainder);
            // Round remainder
            const minutes = Math.floor(time / 60);
            const seconds = time - minutes * 60;
            const first = `${minutes}:${pad(seconds)}`;
            return first + "." + pad(remainder * 25 / 100);
        } else {
            return '0.00';
        }
    }

    transform(percent: number, duration: number): string {
        return this.formatValue(roundFn(percent * duration / 100, 1/25, 0));
    }
}

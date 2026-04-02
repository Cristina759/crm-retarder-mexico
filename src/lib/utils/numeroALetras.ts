export function numeroALetras(n: number, currency = 'PESOS', suffix = 'M.N.'): string {
    const unidades = ['CERO', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const decenas2 = ['', '', 'VEINTI', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    let num = Math.floor(n);
    let centavos = Math.round((n - num) * 100);

    if (num === 0) return 'CERO ' + currency + ' ' + centavos.toString().padStart(2, '0') + '/100 ' + suffix;

    function dec(n: number): string {
        if (n < 10) return unidades[n];
        if (n < 20) return decenas[n - 10];
        let d = Math.floor(n / 10), u = n % 10;
        if (n === 20) return 'VEINTE';
        if (d === 2) return decenas2[d] + unidades[u];
        if (u === 0) return decenas2[d];
        return decenas2[d] + ' Y ' + unidades[u];
    }

    function cen(n: number): string {
        if (n === 100) return 'CIEN';
        let c = Math.floor(n / 100), d = n % 100;
        if (d === 0) return centenas[c];
        return centenas[c] + ' ' + dec(d);
    }

    function mil(n: number): string {
        const m = Math.floor(n / 1000), c = n % 1000;
        let s = '';
        if (m === 1) s = 'MIL';
        else if (m > 1) {
            if (m < 1000) s = cen(m) + ' MIL';
            else s = millon(m) + ' MIL'; // Over 999k
        }

        if (c > 0) s += ' ' + cen(c);
        return s.trim();
    }

    function millon(n: number): string {
        const m = Math.floor(n / 1000000), mi = n % 1000000;
        let s = '';
        if (m === 1) s = 'UN MILLON';
        else if (m > 1) s = mil(m) + ' MILLONES';

        if (mi > 0) s += ' ' + mil(mi);
        return s.trim();
    }

    let t = '';
    if (num < 1000) t = cen(num);
    else if (num < 1000000) t = mil(num);
    else t = millon(num);

    let letras = t.trim();
    return letras + ' ' + currency + ' ' + centavos.toString().padStart(2, '0') + '/100 ' + suffix;
}

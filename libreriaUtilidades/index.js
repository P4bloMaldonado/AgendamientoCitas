function formatCurrency(value) {
    const number = parseFloat(value);
    if (isNaN(number)) return '$0.00';
    return `$${number.toFixed(2)}`;
}

function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function isWeekend(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
}

module.exports = {
    formatCurrency,
    capitalize,
    isWeekend
};

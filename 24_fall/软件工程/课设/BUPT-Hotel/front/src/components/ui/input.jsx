export const Input = ({ placeholder, value, onChange, className = '' }) => {
    return (
        <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`w-full px-3 py-2 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg text-gray-800 border border-white border-opacity-30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 ${className}`}
        />
    );
};
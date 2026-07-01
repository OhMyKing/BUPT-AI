export const Button = ({ children, onClick, variant = 'default', className = '', icon: Icon }) => {
    const baseStyle = "text-sm px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center justify-center";
    const variantStyles = {
        default: "bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg text-gray-800 hover:bg-opacity-30 focus:ring-blue-300",
        outline: "bg-transparent border border-white border-opacity-30 text-gray-800 hover:bg-white hover:bg-opacity-10 focus:ring-blue-300"
    };

    return (
        <button
            className={`${baseStyle} ${variantStyles[variant]} ${className}`}
            onClick={onClick}
        >
            {Icon && <Icon size={16} className="mr-2" />}
            {children}
        </button>
    );
};

const NormalCard = ({ children, className = '' }) => (
    <div className={`bg-white rounded-3xl p-6 shadow-lg ${className}`}>
        {children}
    </div>
);

export default NormalCard;
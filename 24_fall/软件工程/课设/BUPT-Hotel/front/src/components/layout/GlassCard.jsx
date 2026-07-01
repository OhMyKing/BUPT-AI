const GlassCard = ({ children, className = '' }) => (
    <div className={`bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl p-6 shadow-lg ${className}`}>
        {children}
    </div>
);

export default GlassCard;
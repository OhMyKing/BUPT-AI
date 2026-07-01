export const MenuItem = ({icon: Icon, text, active, onClick}) => (
    <div
        className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer ${
            active ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-10'
        }`}
        onClick={onClick}
    >
        <Icon size={20} />
        <span>{text}</span>
    </div>
);

export default MenuItem;
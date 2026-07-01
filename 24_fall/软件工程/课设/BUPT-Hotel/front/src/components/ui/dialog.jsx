import { X  } from 'lucide-react';
export const Dialog = ({ open, onClose, title, children, maxWidth = 'max-w-md' }) => {
    if (!open) return null;

    return (
        <div className="rounded-3xl fixed inset-0 z-50 overflow-auto bg-black bg-opacity-30 flex items-center justify-center">
            <div className={`bg-white bg-opacity-90 backdrop-filter backdrop-blur-xl rounded-2xl w-full ${maxWidth} mx-4 shadow-lg border border-white`}>
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                        <button
                            onClick={onClose}
                            className="bg-white bg-opacity-25 backdrop-filter backdrop-blur-xl rounded-full p-1 hover:bg-opacity-40 transition-all duration-200 focus:outline-none"
                        >
                            <X size={20} className="text-gray-800"/>
                        </button>
                    </div>
                </div>
                <div className="px-6 py-4 ">
                    {children}
                </div>
            </div>
        </div>
    );
};
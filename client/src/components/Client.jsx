import {AuthContext, AuthProvider} from './AuthContext';
import RegAndLogin from './RegAndLogin';
import Groups from './Groups';
import Contacts from "./Contacts";
import Chat from './Chat';
import {useContext, useState} from "react";

function AppContent() {
    const { isLoggedIn } = useContext(AuthContext);
    const [showSidebar, setShowSidebar] = useState(false);

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0">
                <RegAndLogin onMenuToggle={() => setShowSidebar(prev => !prev)} showMenu={isLoggedIn} />
            </div>

            {isLoggedIn ? (
                <div className="flex flex-1 overflow-hidden relative">

                    <aside
                        className={`
                            flex flex-col shrink-0 overflow-y-auto
                            bg-white border-r border-gray-200
                            transition-transform duration-300 ease-in-out
                            w-72
                            /* mobile: fixed drawer over content */
                            fixed inset-y-0 top-0 pt-16 z-30 h-full
                            ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
                            /* desktop: static, always shown */
                            md:static md:translate-x-0 md:pt-0 md:h-auto md:z-auto md:shrink-0`}>
                        <Groups />
                        <hr className="mx-4 border-gray-200" />
                        <Contacts />
                    </aside>

                    {showSidebar && (
                        <div
                            className="fixed inset-0 z-20 bg-black/30 md:hidden"
                            onClick={() => setShowSidebar(false)}
                        />
                    )}

                    <main className="flex-1 overflow-hidden bg-gray-50">
                        <Chat onBack={() => setShowSidebar(true)} />
                    </main>
                </div>
            ) : (
                <div className="flex-1 flex justify-center items-center text-gray-500 text-lg">
                    <p>Você precisa fazer login!</p>
                </div>
            )}
        </div>
    );
}

export default function Client() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
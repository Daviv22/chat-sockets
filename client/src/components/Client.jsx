import {AuthContext, AuthProvider} from './AuthContext';
import RegAndLogin from './RegAndLogin';
import Groups from './Groups';
import Contacts from "./Contacts";
import Chat from './Chat';
import {useContext} from "react";

function AppContent() {
    const { isLoggedIn } = useContext(AuthContext);

    return (
        <div className="h-screen w-screen grid grid-cols-[300px_1fr] grid-rows-[auto_1fr] gap-2">
            <div className="col-span-2">
                <RegAndLogin />
            </div>

            {isLoggedIn ? (
                <>
                    <div className="grid grid-rows-2 gap-2">
                        <Groups/>
                        <Contacts/>
                    </div>
                    <div className="bg-gray-100 border rounded-lg overflow-hidden">
                        <Chat/>
                    </div>
                </>
            ) : (
                <div className="col-span-2 flex justify-center items-center">
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
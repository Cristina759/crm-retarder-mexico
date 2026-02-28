import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-retarder-gray-900 via-retarder-gray-800 to-retarder-black">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Logo / Brand */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        RETARDER <span className="text-retarder-red">MÉXICO</span>
                    </h1>
                    <p className="text-retarder-gray-400 text-sm mt-1">
                        Sistema de Gestión de Servicios
                    </p>
                </div>

                {/* Clerk Sign In */}
                <SignIn
                    signUpUrl={undefined}
                    appearance={{
                        elements: {
                            rootBox: 'w-full',
                            card: 'shadow-2xl border border-retarder-gray-700/50',
                            footer: 'hidden',
                            footerAction: 'hidden', // Extra layer of protection
                        },
                    }}
                />
            </div>
        </div>
    );
}

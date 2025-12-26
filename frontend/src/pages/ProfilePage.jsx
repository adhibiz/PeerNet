import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
    const { userData, userProfile } = useAuth(); // AuthContext exposes userData (alias userProfile)
    const profile = userData || userProfile; // Safely get profile

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: profile?.name || '',
        bio: profile?.bio || '',
        skills: profile?.skills?.join(', ') || ''
    });

    const handleUpdate = async () => {
        if (!profile) return;
        try {
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);

            await updateDoc(doc(db, 'users', profile.id), {
                name: formData.name,
                bio: formData.bio,
                skills: skillsArray,
                updatedAt: new Date()
            });

            toast.success('Profile updated successfully');
            setIsEditing(false);
            // In a real app, we might need to refresh local state if not using real-time listener involved in AuthContext
            // But AuthContext uses onAuthStateChanged -> fetch -> setUserData, so a reload might be needed 
            // OR we rely on the fact that we just updated Firestore. 
            // Note: AuthContext doesn't listen to profile changes in real-time in my implementation (it fetches once on login).
            // TO FIX: AuthContext should ideally use onSnapshot for profile.
            // For now, I'll trust the user will refresh or I could trigger a reload.
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        }
    };

    if (!profile) return <div>Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32"></div>
                <div className="px-8 py-6 relative">
                    <div className="absolute -top-16 left-8">
                        <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
                            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-4xl text-gray-500 font-bold overflow-hidden">
                                {profile.avatar ? <img src={profile.avatar} alt="Avatar" /> : profile.name.charAt(0)}
                            </div>
                        </div>
                    </div>

                    <div className="ml-36 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                            <p className="text-gray-500">@{profile.username}</p>
                        </div>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
                        >
                            {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                    </div>
                </div>

                <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Stats */}
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <h3 className="font-bold text-gray-700 mb-3">Learning Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Sessions</span>
                                    <span className="font-bold">{profile.stats?.sessionsCompleted || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Hosted</span>
                                    <span className="font-bold">{profile.stats?.sessionsHosted || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Streak</span>
                                    <span className="font-bold text-orange-500">🔥 {profile.stats?.streak || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Contribution</span>
                                    <span className="font-bold text-green-600">{profile.stats?.contributionScore || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-700 mb-3">Interests</h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills && profile.skills.map((skill, idx) => (
                                    <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                        {skill}
                                    </span>
                                ))}
                                {(!profile.skills || profile.skills.length === 0) && (
                                    <span className="text-gray-500 text-sm">No skills listed yet.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Bio & Edit Form */}
                    <div className="md:col-span-2">
                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 h-32"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                                    <input
                                        type="text"
                                        value={formData.skills}
                                        onChange={e => setFormData({ ...formData, skills: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="React, Design, Python..."
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleUpdate}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">About</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {profile.bio || "This user hasn't written a bio yet."}
                                </p>

                                <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Recent Achievements</h3>
                                {profile.stats?.achievements && profile.stats.achievements.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {profile.stats.achievements.map((ach, idx) => (
                                            <div key={idx} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                                <div className="text-2xl">🏆</div>
                                                <div>
                                                    <div className="font-bold text-gray-800">{ach.name}</div>
                                                    <div className="text-xs text-gray-500">{new Date(ach.achievedAt?.seconds * 1000).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 italic">No achievements yet. Start learning to earn badges!</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

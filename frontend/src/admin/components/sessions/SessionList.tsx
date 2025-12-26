import React from 'react';
import { FaPlay, FaStop, FaVideo, FaEye } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';

const SessionList = ({ sessions, onAction }) => {
    return (
        <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{session.topic || 'Untitled'}</td>
                            <td className="px-6 py-4">{session.hostName || session.hostId || 'Unknown'}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs ${session.status === 'active' ? 'bg-green-100 text-green-800' :
                                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {session.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                                {session.startTime ? format(parseISO(session.startTime), 'MMM d, p') : 'TBD'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                                {session.duration ? `${session.duration} min` : '-'}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex space-x-2">
                                    <button onClick={() => onAction('view', session)} className="text-gray-600 hover:text-blue-600"><FaEye /></button>
                                    {session.status === 'active' && (
                                        <button onClick={() => onAction('join', session)} className="text-gray-600 hover:text-green-600"><FaVideo /></button>
                                    )}
                                    {session.status === 'active' && (
                                        <button onClick={() => onAction('end', session)} className="text-gray-600 hover:text-red-600"><FaStop /></button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {sessions.length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No sessions found</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SessionList;

import React from 'react';

export const HardestShootersLeaderboard = () => {
    const shooters = [
        { name: "Philippe Myers", date: "Apr 1, 2026", speed: "99.30" },
        { name: "Nicholas Robertson", date: "Nov 14, 2025", speed: "94.77" },
        { name: "Calle Jarnkrok", date: "Dec 12, 2025", speed: "94.51" },
    ];

    return (
        <div style={{ width: '100%', background: '#050a14', padding: '24px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '0 0 20px 0' }}>Hardest Shooters</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {shooters.map((player, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a1220', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', background: '#00205B', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }}></div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>{player.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{player.date}</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {player.speed} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'rgba(255,255,255,0.6)' }}>mph</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
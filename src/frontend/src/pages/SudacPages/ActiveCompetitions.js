import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { downloadCompetitionPdf } from "../../utils/downloadPdf";


function ActiveCompetitions() {
  const auth = useAuth();
  const judgeId = auth?.currentUser?._id;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!judgeId) {
      setError('Niste prijavljeni.');
      setLoading(false);
      return;
    }

    const fetchCompetitions = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/competitions/judge/${judgeId}`
        );
        if (!res.ok) throw new Error('Greška pri dohvaćanju');

        const data = await res.json();

        const filtered = (data || [])
          .filter(c => c.status === 'ongoing' || c.status === 'upcoming')
          .sort((a, b) => {
            const order = { ongoing: 0, upcoming: 1 };
            return (order[a.status] ?? 2) - (order[b.status] ?? 2);
          });

        setCompetitions(filtered);
      } catch (err) {
        setError('Nije moguće dohvatiti natjecanja.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, [judgeId]);

  if (loading) return <p>Učitavanje...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  if (competitions.length === 0) {
    return <p>Nema aktivnih ili nadolazećih natjecanja.</p>;
  }

  return (
    <div className="competition-list">
      {competitions.map(comp => (
        <div key={comp._id} className="dashboard-card" style={{ marginBottom: 16 }}>
          <h3>{comp.name}</h3>
          <p>📅 {new Date(comp.date).toLocaleDateString('hr-HR')}</p>
          <p>📍 {comp.location}</p>

          {comp.status === 'ongoing' ? (
            <button
              className="card-button btn-success"
              onClick={() => navigate(`/sudac/ocjenjivanje/${comp._id}`)}
            >
              Ocijeni nastupe
            </button>
          ) : (
            <button className="card-button btn-secondary" disabled>
              Nadolazeće
            </button>
          )}

          {(
                  <button
                    className="btn-export"
                    onClick={() =>
                      downloadCompetitionPdf(comp._id, token)
                        .catch(err => alert(err.message))
                    }
                  >
                    Preuzmi startnu listu (PDF)
                  </button>
                )}
        </div>
      ))}
    </div>
  );
}

export default ActiveCompetitions;

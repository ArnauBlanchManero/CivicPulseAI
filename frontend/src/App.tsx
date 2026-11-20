import { useEffect, useMemo, useState } from "react";
import './App.css'

interface Registro {
  ESTACION: string;
  MAGNITUD: string;
  PUNTO_MUESTREO: string;
  ANO: string;
  MES: string;
  DIA: string;
  [key: string]: string;
}

interface Respuesta {
  total: number;
  registros: Registro[];
}

interface Medicion {
  hora: number;
  valor: number;
  validacion: string;
}

const obtenerMediciones = (registro: Registro): Medicion[] => {
  return Array.from({ length: 24 }, (_, i) => {
    const hora = i + 1;
    const numero = String(hora).padStart(2, "0");

    return {
      hora,
      valor: Number(registro[`H${numero}`] ?? 0),
      validacion: registro[`V${numero}`] ?? "N",
    };
  });
};

function App() {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [estacion, setEstacion] = useState("todas");
  const [magnitud, setMagnitud] = useState("todas");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Carga los datos desde public/datos.json
  useEffect(() => {
    fetch("/datos.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("No se pudieron cargar los datos");
        }
        return response.json();
      })
      .then((data: Respuesta) => setDatos(data))
      .catch(() => setError("Error al cargar los datos de calidad del aire."))
      .finally(() => setCargando(false));
  }, []);

  const registros = datos?.registros ?? [];

  const estaciones = useMemo(
    () => [...new Set(registros.map((r) => r.ESTACION))].sort(),
    [registros]
  );

  const magnitudes = useMemo(
    () => [...new Set(registros.map((r) => r.MAGNITUD))].sort(),
    [registros]
  );

  const filtrados = useMemo(
    () =>
      registros.filter(
        (r) =>
          (estacion === "todas" || r.ESTACION === estacion) &&
          (magnitud === "todas" || r.MAGNITUD === magnitud)
      ),
    [registros, estacion, magnitud]
  );

  const registroSeleccionado = filtrados[0];

  const mediciones = registroSeleccionado
    ? obtenerMediciones(registroSeleccionado)
    : [];

  const medicionesValidas = filtrados.flatMap((r) =>
    obtenerMediciones(r).filter((m) => m.validacion === "V")
  );

  const promedio =
    medicionesValidas.length > 0
      ? medicionesValidas.reduce((sum, m) => sum + m.valor, 0) /
        medicionesValidas.length
      : 0;

  const ultimaMedicion = mediciones
    .filter((m) => m.validacion === "V")
    .at(-1);

  if (cargando) {
    return <main className="loading">Cargando datos de calidad del aire...</main>;
  }

  if (error || !datos) {
    return (
      <main className="loading">
        <h2>No se pueden mostrar los datos</h2>
        <p>{error}</p>
        <p>
          Comprueba que existe <code>public/datos.json</code>.
        </p>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <span className="eyebrow">CIVICPULSE AI · OPEN DATA</span>
          <h1>Calidad del aire</h1>
          <p>Consulta las mediciones de contaminación atmosférica de Madrid.</p>
        </div>

        <div className="date">
          {registroSeleccionado
            ? `${registroSeleccionado.DIA}/${registroSeleccionado.MES}/${registroSeleccionado.ANO}`
            : "Datos disponibles"}
        </div>
      </header>

      <section className="filters">
        <label>
          Estación
          <select value={estacion} onChange={(e) => setEstacion(e.target.value)}>
            <option value="todas">Todas las estaciones</option>
            {estaciones.map((e) => (
              <option key={e} value={e}>
                Estación {e}
              </option>
            ))}
          </select>
        </label>

        <label>
          Contaminante (magnitud)
          <select value={magnitud} onChange={(e) => setMagnitud(e.target.value)}>
            <option value="todas">Todas las magnitudes</option>
            {magnitudes.map((m) => (
              <option key={m} value={m}>
                Magnitud {m}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="stats">
        <article className="stat-card">
          <span>Registros totales</span>
          <strong>{datos.total}</strong>
          <small>Datos recibidos</small>
        </article>

        <article className="stat-card">
          <span>Estaciones</span>
          <strong>{estacion === "todas" ? estaciones.length : 1}</strong>
          <small>Estaciones seleccionadas</small>
        </article>

        <article className="stat-card">
          <span>Media de mediciones</span>
          <strong>{promedio.toFixed(2)}</strong>
          <small>Solo mediciones válidas</small>
        </article>

        <article className="stat-card">
          <span>Última medición válida</span>
          <strong>
            {ultimaMedicion ? ultimaMedicion.valor : "—"}
          </strong>
          <small>
            {ultimaMedicion
              ? `Hora ${String(ultimaMedicion.hora).padStart(2, "0")}:00`
              : "Sin datos válidos"}
          </small>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Evolución durante el día</h2>
            <p>
              {registroSeleccionado
                ? `Estación ${registroSeleccionado.ESTACION} · Magnitud ${registroSeleccionado.MAGNITUD}`
                : "Selecciona una estación y magnitud"}
            </p>
          </div>
          <span className="legend">
            <i /> Medición válida
          </span>
        </div>

        {registroSeleccionado ? (
          <div className="chart">
            {mediciones.map((m) => (
              <div className="chart-column" key={m.hora}>
                <span className="bar-value">
                  {m.validacion === "V" ? m.valor : "—"}
                </span>
                <div className="bar-container">
                  <div
                    className={`bar ${m.validacion === "N" ? "invalid" : ""}`}
                    style={{
                      height:
                        m.validacion === "V"
                          ? `${Math.max(
                              (m.valor /
                                Math.max(
                                  ...mediciones
                                    .filter((x) => x.validacion === "V")
                                    .map((x) => x.valor),
                                  1
                                )) *
                                100,
                              3
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
                <span className="hour">{m.hora}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay mediciones para estos filtros.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Registros de medición</h2>
            <p>{filtrados.length} registros encontrados</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Estación</th>
                <th>Magnitud</th>
                <th>Punto de muestreo</th>
                <th>Fecha</th>
                <th>Media diaria*</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => {
                const valores = obtenerMediciones(r).filter(
                  (m) => m.validacion === "V"
                );

                const media =
                  valores.length > 0
                    ? valores.reduce((sum, m) => sum + m.valor, 0) /
                      valores.length
                    : null;

                return (
                  <tr key={r.PUNTO_MUESTREO}>
                    <td>Estación {r.ESTACION}</td>
                    <td>Magnitud {r.MAGNITUD}</td>
                    <td>{r.PUNTO_MUESTREO}</td>
                    <td>{`${r.DIA}/${r.MES}/${r.ANO}`}</td>
                    <td>{media === null ? "—" : media.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <small className="footnote">
          * Media aritmética de las mediciones horarias válidas disponibles.
        </small>
      </section>

      <footer>
        CivicPulse AI · Datos abiertos de calidad del aire
      </footer>
    </main>
  );
}

export default App;


/**
 * Pit Pong — backend en Google Sheets + Drive
 *
 * Guarda jugadores, torneos, partidos y fotos para que la app se vea igual
 * desde cualquier móvil, tablet u ordenador.
 *
 * CÓMO SE USA (ya está hecho, esto es sólo referencia):
 *   1. Hoja de cálculo "Pit Pong DB" (ID abajo).
 *   2. Implementar > Nueva implementación > Aplicación web
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: Cualquier usuario
 *   3. Pegar la URL /exec en PITPONG_API de index.html
 *
 * IMPORTANTE: la app envía Content-Type "text/plain" a propósito. Con
 * "application/json" el navegador haría una petición previa OPTIONS que
 * Apps Script no sabe responder, y todas las llamadas fallarían por CORS.
 */

var SHEET_ID = '1jyQZHeDxSvT0xkJ5Rlcg86d3a7uW8QjQ08ym8h7NVGU';
var CARPETA_FOTOS = 'Pit Pong - Fotos';

/**
 * openById y getSheetByName son llamadas caras: sin caché, un guardado con
 * 36 partidos tardaba ~60 segundos. Guardándolas baja a pocos segundos.
 */
var _ss = null;
var _hojas = {};

function ss_() {
  if (!_ss) _ss = SpreadsheetApp.openById(SHEET_ID);
  return _ss;
}

function hoja_(nombre) {
  if (_hojas[nombre]) return _hojas[nombre];
  var h = ss_().getSheetByName(nombre);
  if (!h) throw new Error('Falta la hoja "' + nombre + '" en Pit Pong DB');
  _hojas[nombre] = h;
  return h;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Lee una hoja como array de objetos usando la fila 1 como cabecera. */
function leerTabla_(nombre) {
  var datos = hoja_(nombre).getDataRange().getValues();
  if (datos.length < 2) return [];
  var cab = datos[0];
  var filas = [];
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][0]).trim() === '') continue; // fila vacía
    var o = {};
    for (var c = 0; c < cab.length; c++) o[cab[c]] = datos[i][c];
    filas.push(o);
  }
  return filas;
}

/**
 * Sustituye el contenido de una hoja (menos la cabecera).
 *
 * Escribir en Sheets es lento (segundos por operación), así que primero
 * comparamos con lo que ya hay: si la tabla no ha cambiado, no se toca.
 * Guardar el resultado de un partido ya no reescribe la lista de
 * jugadores ni el resto de tablas.
 */
function escribirTabla_(nombre, filas) {
  var h = hoja_(nombre);
  var ultimaFila = h.getLastRow();
  var ultimaCol = h.getLastColumn();
  var cab = h.getRange(1, 1, 1, ultimaCol).getValues()[0];

  var matriz = (filas || []).map(function (f) {
    return cab.map(function (col) {
      var v = f[col];
      return (v === undefined || v === null) ? '' : v;
    });
  });

  // ¿Idéntico a lo que ya está escrito? Entonces no hacemos nada.
  var actual = (ultimaFila > 1)
    ? h.getRange(2, 1, ultimaFila - 1, ultimaCol).getValues()
        .filter(function (r) { return String(r[0]).trim() !== ''; })
    : [];
  if (JSON.stringify(actual) === JSON.stringify(matriz)) return false;

  if (ultimaFila > 1) {
    h.getRange(2, 1, ultimaFila - 1, ultimaCol).clearContent();
  }
  if (matriz.length) {
    h.getRange(2, 1, matriz.length, cab.length).setValues(matriz);
  }
  return true;
}

/* ============ Conversión entre el modelo de la app y las hojas ============ */

function nombresDe_(ids, mapaJugadores) {
  return (ids || []).map(function (id) {
    return mapaJugadores[id] || id;
  }).join(' + ');
}

function parcialesTexto_(games) {
  return (games || []).map(function (g) { return g.a + '-' + g.b; }).join(' | ');
}

function parcialesParse_(texto) {
  if (!texto) return [];
  return String(texto).split('|').map(function (p) {
    var m = p.trim().match(/^(\d+)\s*-\s*(\d+)$/);
    return m ? { a: Number(m[1]), b: Number(m[2]) } : null;
  }).filter(function (x) { return x; });
}

function fecha_(ms) {
  if (!ms) return '';
  return Utilities.formatDate(new Date(Number(ms)), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

/* ============================ API ============================ */

function doGet(e) {
  try {
    return json_({ ok: true, datos: cargarTodo_() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var accion = body.accion;

    if (accion === 'guardar') {
      // guardarTodo_ ya devuelve el estado fusionado: releer la hoja otra vez
      // sólo para responder duplicaba el tiempo de guardado.
      return json_({ ok: true, datos: guardarTodo_(body.datos) });
    }
    if (accion === 'cargar') {
      return json_({ ok: true, datos: cargarTodo_() });
    }
    if (accion === 'subirFoto') {
      return json_({ ok: true, foto: subirFoto_(body) });
    }
    return json_({ ok: false, error: 'Acción desconocida: ' + accion });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ------------------------------ CARGAR ------------------------------ */

function cargarTodo_() {
  var jugadores = leerTabla_('Jugadores').map(function (f) {
    return { id: String(f.id), name: String(f.nombre), creadoEn: f.creadoEn || '' };
  });

  var partidosPorTorneo = {};
  leerTabla_('Partidos').forEach(function (f) {
    var tid = String(f.torneoId);
    if (!partidosPorTorneo[tid]) partidosPorTorneo[tid] = [];
    // Las columnas con nombre son para leerlas nosotros; la app trabaja
    // siempre con los ids (columnas ...Id), que son los que no cambian
    // aunque se renombre a un jugador.
    partidosPorTorneo[tid].push({
      id: String(f.id),
      jornada: Number(f.jornada) || 1,
      a: String(f.jugadorAId),
      b: String(f.jugadorBId),
      winner: f.ganadorId ? String(f.ganadorId) : null,
      sets: parcialesParse_(f.parciales),
      scoreLabel: f.resultado ? String(f.resultado) : ''
    });
  });

  var fotosPorRegistro = {};
  leerTabla_('Fotos').forEach(function (f) {
    var rid = String(f.registroId);
    if (!fotosPorRegistro[rid]) fotosPorRegistro[rid] = [];
    fotosPorRegistro[rid].push({
      id: String(f.id),
      dataUrl: String(f.urlDrive),
      addedAt: f.subidoEn ? new Date(f.subidoEn).getTime() : Date.now()
    });
  });

  var torneos = leerTabla_('Torneos').map(function (f) {
    var id = String(f.id);
    return {
      id: id,
      name: String(f.nombre),
      format: String(f.formato || 'liguilla'),
      status: String(f.estado || 'activo'),
      pointsPerGame: Number(f.puntosPorJuego) || 11,
      setsToWin: Number(f.juegosParaGanar) || 2,
      numJornadas: Number(f.numJornadas) || 1,
      playerIds: String(f.jugadoresIds || '').split(',').filter(String),
      champion: f.campeonId ? String(f.campeonId) : null,
      createdAt: f.creadoEn ? new Date(f.creadoEn).getTime() : Date.now(),
      finishedAt: f.finalizadoEn ? new Date(f.finalizadoEn).getTime() : null,
      matches: partidosPorTorneo[id] || [],
      photos: fotosPorRegistro[id] || []
    };
  });

  var sueltos = leerTabla_('PartidosSueltos').map(function (f) {
    var id = String(f.id);
    return {
      id: id,
      modo: String(f.modo || '1vs1'),
      equipoA: String(f.equipoAIds || '').split(',').filter(String),
      equipoB: String(f.equipoBIds || '').split(',').filter(String),
      pointsPerGame: Number(f.puntosPorJuego) || 11,
      ganador: String(f.ganadorLado || 'A'),
      scoreLabel: String(f.resultado || ''),
      games: parcialesParse_(f.parciales),
      playedAt: f.jugadoEn ? new Date(f.jugadoEn).getTime() : Date.now(),
      photos: fotosPorRegistro[id] || []
    };
  });

  return { jugadores: jugadores, torneos: torneos, partidosSueltos: sueltos };
}

/* ------------------------------ GUARDAR ------------------------------ */

/**
 * Fusiona por id en vez de reemplazar. Si dos dispositivos tienen estados
 * distintos, el que guarda no borra lo que el otro añadió: sólo pisa los
 * registros con el mismo id y elimina los que se borraron a propósito.
 */
function mergePorId_(base, entrantes, borrados) {
  var mapa = {};
  (base || []).forEach(function (r) { mapa[r.id] = r; });
  (entrantes || []).forEach(function (r) { mapa[r.id] = r; });
  (borrados || []).forEach(function (id) { delete mapa[id]; });
  return Object.keys(mapa).map(function (k) { return mapa[k]; });
}

function guardarTodo_(datos) {
  var lock = LockService.getScriptLock();
  lock.waitLock(25000); // dos tablets guardando a la vez no se pisan
  try {
    var actual = cargarTodo_();
    var elim = datos.eliminados || {};

    var jugadores = mergePorId_(actual.jugadores, datos.jugadores, elim.jugadores);
    var torneos = mergePorId_(actual.torneos, datos.torneos, elim.torneos);
    var sueltos = mergePorId_(actual.partidosSueltos, datos.partidosSueltos, elim.partidosSueltos);

    var mapa = {};
    jugadores.forEach(function (j) { mapa[j.id] = j.name; });

    escribirTabla_('Jugadores', jugadores.map(function (j) {
      // Conservamos la fecha de alta original si ya estaba en la hoja.
      return { id: j.id, nombre: j.name, creadoEn: j.creadoEn || fecha_(Date.now()) };
    }));

    escribirTabla_('Torneos', torneos.map(function (t) {
      return {
        id: t.id,
        nombre: t.name,
        formato: t.format || 'liguilla',
        estado: t.status,
        puntosPorJuego: t.pointsPerGame,
        juegosParaGanar: t.setsToWin,
        numJornadas: t.numJornadas,
        jugadoresIds: (t.playerIds || []).join(','),
        jugadoresNombres: nombresDe_(t.playerIds, mapa).split(' + ').join(', '),
        campeonId: t.champion || '',
        creadoEn: fecha_(t.createdAt),
        finalizadoEn: fecha_(t.finishedAt)
      };
    }));

    var filasPartidos = [];
    torneos.forEach(function (t) {
      (t.matches || []).forEach(function (m) {
        filasPartidos.push({
          id: m.id,
          torneoId: t.id,
          torneoNombre: t.name,
          jornada: m.jornada,
          jugadorA: mapa[m.a] || m.a,
          jugadorB: mapa[m.b] || m.b,
          jugadorAId: m.a,
          jugadorBId: m.b,
          ganador: m.winner ? (mapa[m.winner] || m.winner) : '',
          ganadorId: m.winner || '',
          resultado: m.scoreLabel || '',
          parciales: parcialesTexto_(m.sets),
          jugadoEn: m.winner ? fecha_(t.finishedAt || Date.now()) : ''
        });
      });
    });
    escribirTabla_('Partidos', filasPartidos);

    escribirTabla_('PartidosSueltos', sueltos.map(function (p) {
      return {
        id: p.id,
        modo: p.modo,
        equipoA: nombresDe_(p.equipoA, mapa),
        equipoB: nombresDe_(p.equipoB, mapa),
        equipoAIds: (p.equipoA || []).join(','),
        equipoBIds: (p.equipoB || []).join(','),
        puntosPorJuego: p.pointsPerGame,
        ganador: p.ganador === 'A' ? nombresDe_(p.equipoA, mapa) : nombresDe_(p.equipoB, mapa),
        ganadorLado: p.ganador,
        resultado: p.scoreLabel,
        parciales: parcialesTexto_(p.games),
        jugadoEn: fecha_(p.playedAt)
      };
    }));

    // Devolvemos el estado ya fusionado (las fotos siguen viviendo en su
    // hoja, así que se conservan tal cual venían de cargarTodo_).
    return { jugadores: jugadores, torneos: torneos, partidosSueltos: sueltos };
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------ FOTOS ------------------------------ */

function carpetaFotos_() {
  var it = DriveApp.getFoldersByName(CARPETA_FOTOS);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA_FOTOS);
}

/**
 * Recibe la foto en base64, la sube a Drive y devuelve un enlace directo.
 * En la hoja sólo se guarda el enlace: una celda no puede contener la imagen.
 */
function subirFoto_(body) {
  var base64 = String(body.dataUrl || '').replace(/^data:image\/\w+;base64,/, '');
  var bytes = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(bytes, 'image/jpeg', (body.nombre || 'foto') + '.jpg');

  var archivo = carpetaFotos_().createFile(blob);
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var url = 'https://drive.google.com/thumbnail?id=' + archivo.getId() + '&sz=w1600';
  var id = 'f_' + archivo.getId();

  hoja_('Fotos').appendRow([
    id,
    String(body.registroId || ''),
    String(body.tipo || ''),
    String(body.descripcion || ''),
    url,
    fecha_(Date.now())
  ]);

  return { id: id, dataUrl: url, addedAt: Date.now() };
}

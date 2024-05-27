import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketProvider';
import '../css/codeEditor.component.css';

const CodeEditor = () => {
    const socket = useSocket();
    const [html, setHtml] = useState('');
    const [css, setCss] = useState('');
    const [js, setJs] = useState('');
    const [activeEditor, setActiveEditor] = useState('html');

    const runCode = () => {
        const iframe = document.getElementById('iframe').contentWindow.document;
        iframe.open();
        iframe.write(`${html}<style>${css}</style><script>${js}</script>`);
        iframe.close();
    };

    const { roomId } = useParams();

    const changeHTML = (value) => {
        setHtml(value);
        socket.emit('html', value, roomId);
    };

    const changeCSS = (value) => {
        setCss(value);
        socket.emit('css', value, roomId);
    };

    const changeJS = (value) => {
        setJs(value);
        socket.emit('js', value, roomId);
    };

    useEffect(() => {
        socket.emit('join', roomId, html, css, js);
        socket.on('html', (data) => {
            setHtml(data);
            console.log(data);
        });
        socket.on('css', (data) => {
            setCss(data);
            console.log(data);
        });
        socket.on('js', (data) => {
            setJs(data);
            console.log(data);
        });
    }, []);

    return (
        <>
            <div id='toggle-buttons'>
                <button onClick={() => setActiveEditor('html')} id='html-toggle-button'>HTML</button>
                <button onClick={() => setActiveEditor('css')} id='css-toggle-button'>CSS</button>
                <button onClick={() => setActiveEditor('js')} id='js-toggle-button'>JS</button>
            </div>
            <div id='editor-container' style={{ display: activeEditor === 'html' ? 'block' : 'none' }}>
                <center><p>HTML</p></center>
                <div id="editor">
                    <div id='html-editor'>
                        <Editor
                            height="90vh"
                            defaultLanguage="html"
                            value={html}
                            onChange={(value) => changeHTML(value)}
                            options={{
                                wordWrap: 'on',
                                minimap: { enabled: false },
                                showUnused: false,
                                folding: false,
                                lineNumbersMinChars: 3,
                                fontSize: 16,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>
                </div>
            </div>
            <div id='editor-container' style={{ display: activeEditor === 'css' ? 'block' : 'none' }}>
                <center><p>CSS</p></center>
                <div id="editor">
                    <div id='css-editor'>
                        <Editor
                            height="90vh"
                            defaultLanguage="css"
                            value={css}
                            onChange={(value) => changeCSS(value)}
                            options={{
                                wordWrap: 'on',
                                minimap: { enabled: false },
                                showUnused: false,
                                folding: false,
                                lineNumbersMinChars: 3,
                                fontSize: 16,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>
                </div>
            </div>
            <div id='editor-container' style={{ display: activeEditor === 'js' ? 'block' : 'none' }}>
                <center><p>JS</p></center>
                <div id="editor">
                    <div id='js-editor'>
                        <Editor
                            height="90vh"
                            defaultLanguage="javascript"
                            value={js}
                            onChange={(value) => changeJS(value)}
                            options={{
                                wordWrap: 'on',
                                minimap: { enabled: false },
                                showUnused: false,
                                folding: false,
                                lineNumbersMinChars: 3,
                                fontSize: 16,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>
                </div>
            </div>
            <div id='run-button-container'>
                <button onClick={runCode} id='run-button'>Run</button>
            </div>
            <div id='iframe-container'>
                <iframe id="iframe" title="result" style={{ width: '100%', height: '90vh' }} />
            </div>
        </>
    );
};

export default CodeEditor;
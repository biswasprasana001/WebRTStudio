import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketProvider';

const CodeEditor = () => {
    const socket = useSocket();
    const [html, setHtml] = useState('');
    const [css, setCss] = useState('');
    const [js, setJs] = useState('');

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
        <div>
            <div className="editor-container">
                <Editor
                    height="90vh"
                    defaultLanguage="html"
                    // defaultValue={html}
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
                <Editor
                    height="90vh"
                    defaultLanguage="css"
                    // defaultValue={css}
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
                <Editor
                    height="90vh"
                    defaultLanguage="javascript"
                    // defaultValue={js}
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
            <button onClick={runCode}>Run</button>
            <iframe id="iframe" title="result" style={{ width: '100%', height: '90vh' }} />
        </div>
    );
};

export default CodeEditor;
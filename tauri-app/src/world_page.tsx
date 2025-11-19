import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface WorldEntry {
    id: string;
    name: string;
    entry_point_path: string;
}

interface WorldListResponse {
    worlds: WorldEntry[];
}

const WorldPage: React.FC = () => {
    const [worldList, setWorldList] = useState<WorldEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadWorldList = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response: WorldListResponse = await invoke("get_world_list");
                
                setWorldList(response.worlds);

            } catch (err) {
                console.error('Failed to Load World List:', err);
                if (err instanceof Error) {
                    setError(`Failed to Load Data: ${err.message}`);
                } else if (typeof err === 'string') {
                    setError(`Faild to Load Data: ${err}`);
                } else {
                    setError('Faild to Load Data Unkown Error');
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadWorldList();
    }, []); 

    const loadWorldSearch = () => {
        navigate("/world_search");
    };
    const WasmLoader = () => {
        navigate("/wasm_loader");
    };

        const handleWorldClick = async (worldId: string, worldName: string, entryPointPath: string) => {
        console.log(`Try Lunch world: ID=${worldId}, Name=${worldName}, Entry=${entryPointPath}`);
        try {
            await invoke('open_world', {
                entryPointPath: entryPointPath,
                worldName: worldName,
            });
            console.log("World Window was open");
            // navigate('/'); //back to main menu
        } catch (error) {
            console.error("Faild to Load World:", error);
            if (error instanceof Error) {
                alert(`Faild to Lunch World: ${error.message}`);
            } else if (typeof error === 'string') {
                alert(`Faild to Lunch world: ${error}`);
            } else {
                alert('Faild to Lunch World, Unkown error');
            }
        }
    };

    return (
        <div>
            <a href="/">Back</a>
            <button onClick={loadWorldSearch}>WORLD_Search</button>
            <button onClick={WasmLoader}>WORLD_IMPORT</button>

            <h2>World List</h2>
            <div id="content">
                {isLoading && <p>Loading Data...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                {!isLoading && !error && (
                    worldList.length > 0 ? (
                        worldList.map((item) => (
                            <button
                                key={item.id} //world id
                                onClick={() => handleWorldClick(item.id, item.name, item.entry_point_path)}
                                style={{ display: 'block', margin: '10px 0', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer', backgroundColor: '#f9f9f9', width: 'fit-content', color: 'black'}}
                            >
                                {item.name}
                            </button>
                        ))
                    ) : (
                        <p>No World List</p>
                    )
                )}

            </div>
        </div>
    );
};

export default WorldPage;

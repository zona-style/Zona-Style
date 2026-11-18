const SUPABASE_URL = "https://esrtyxxufihegqpuzbgt.supabase.co";
const SUPABASE_KEY = "sb_publishable_fAuzDsXpqi5y8FyT4DE_pw_obogMa6L";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase esta conectado:", supabaseClient);

async function probarSupabase() {
    const { data, error } = await supabaseClient
        .from("categorias")
        .select("*")
        .limit(5);

    if (error) {
        console.error("Error consultando Supabase:", error);
        return;
    }

    console.log("¡Categorías recibidas desde Supabase!");
    console.log(data);
}

probarSupabase();

async function probarProductos() {
    const { data, error } = await supabaseClient
        .from("productos")
        .select("*")
        .limit(5);

    if (error) {
        console.error("Error consultando productos:", error);
        return;
    }

    console.log("Productos recibidos desde Supabase:");
    console.log(data);
}

probarProductos();
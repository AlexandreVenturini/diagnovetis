import { Pet } from "../models/Pet";
import { SupabaseRepository } from "./storage/SupabaseRepository";
import { supabase } from "./storage/supabaseClient";
import { TutorService } from "./TutorService";
import { validarObrigatorio, validarIdUnico } from "./validation/validadores";

const tutorService = new TutorService();

interface PetRow {
    id: number;
    nome: string;
    especie: string;
    raca: string;
    tutor_id: number;
    idade: string;
    peso: string;
    sexo: string;
    historico: string;
}

export const petRepository = new SupabaseRepository<Pet>(
    "pets",
    pet => ({
        id: pet.id,
        nome: pet.nome,
        especie: pet.especie,
        raca: pet.raca,
        tutor_id: pet.tutor.id,
        idade: pet.idade,
        peso: pet.peso,
        sexo: pet.sexo,
        historico: pet.historico
    }),
    raw => {
        const r = raw as PetRow;
        return new Pet(r.id, r.nome, r.especie, r.raca, null as never, [], r.idade ?? '', r.peso ?? '', r.sexo ?? '', r.historico ?? '');
    }
);

export class PetService {
    async listarPets(): Promise<Pet[]> {
        const { data, error } = await supabase.from("pets").select("*");
        if (error) throw new Error(error.message);
        const pets: Pet[] = [];
        for (const r of data ?? []) {
            const tutor = await tutorService.buscarPorId(r.tutor_id);
            if (!tutor) continue;
            const pet = new Pet(r.id, r.nome, r.especie, r.raca, tutor, [], r.idade ?? '', r.peso ?? '', r.sexo ?? '', r.historico ?? '');
            tutor.adicionarPet(pet);
            pets.push(pet);
        }
        return pets;
    }

    async adicionarPet(pet: Pet): Promise<void> {
        const todos = await this.listarPets();
        validarIdUnico(pet.id, todos, "pet");
        validarObrigatorio(pet.nome, "nome");
        validarObrigatorio(pet.especie, "especie");
        validarObrigatorio(pet.raca, "raca");
        const { error } = await supabase.from("pets").insert({
            id: pet.id,
            nome: pet.nome,
            especie: pet.especie,
            raca: pet.raca,
            tutor_id: pet.tutor.id,
            idade: pet.idade,
            peso: pet.peso,
            sexo: pet.sexo,
            historico: pet.historico
        });
        if (error) throw new Error(error.message);
        pet.tutor.adicionarPet(pet);
    }

    async buscarPorId(id: number): Promise<Pet | undefined> {
        const { data, error } = await supabase.from("pets").select("*").eq("id", id).single();
        if (error || !data) return undefined;
        const tutor = await tutorService.buscarPorId(data.tutor_id);
        if (!tutor) return undefined;
        return new Pet(data.id, data.nome, data.especie, data.raca, tutor, [], data.idade ?? '', data.peso ?? '', data.sexo ?? '', data.historico ?? '');
    }

    async listarPorTutor(tutorId: number): Promise<Pet[]> {
        const todos = await this.listarPets();
        return todos.filter(p => p.tutor.id === tutorId);
    }

    async listarPorEspecie(especie: string): Promise<Pet[]> {
        const todos = await this.listarPets();
        return todos.filter(p => p.especie.toLowerCase() === especie.toLowerCase());
    }

    async buscarPorNome(nome: string): Promise<Pet[]> {
        const todos = await this.listarPets();
        return todos.filter(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
    }

    async removerPet(id: number): Promise<void> {
        await supabase.from("pets").delete().eq("id", id);
    }
}

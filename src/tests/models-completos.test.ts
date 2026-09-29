import { describe, it, expect } from 'vitest'
import { Consulta } from '../models/Consulta'
import { DiagnosticoZoonose } from '../models/DiagnosticoZoonose'
import { Endereco } from '../models/Endereco'
import { Medico } from '../models/Medico'
import { Pet } from '../models/Pet'
import { Tutor } from '../models/Tutor'
import { Zoonose } from '../models/Zoonose'

function criarMedico(id = 1): Medico {
    return new Medico(id, 'Dr. Silva', '27933001234', 'silva@vet.com', 'Clínica Geral', '12345-ES')
}

function criarEndereco(): Endereco {
    return new Endereco('Rua das Flores', 100, 'Centro', 'Vitória', 'ES', '29010100')
}

function criarTutor(id = 1): Tutor {
    return new Tutor(id, 'Ana Costa', '27933001234', 'ana@email.com', new Date('2024-01-01'), criarEndereco())
}

function criarPet(tutor: Tutor, id = 1): Pet {
    return new Pet(id, 'Rex', 'Cão', 'Labrador', tutor)
}

function dataFutura(): Date {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d
}

function criarConsulta(medico: Medico, pet: Pet, id = 1): Consulta {
    return new Consulta(id, dataFutura(), '09:00', 'Diagnóstico', 'Obs', medico, pet, new DiagnosticoZoonose('negativo', 'Sem sinais', new Date()))
}

describe('Pessoa (via Medico)', () => {
    it('getId retorna o id', () => {
        expect(criarMedico(3).getId()).toBe(3)
    })

    it('getNome retorna o nome', () => {
        expect(criarMedico().getNome()).toBe('Dr. Silva')
    })

    it('setNome altera o nome', () => {
        const m = criarMedico()
        m.setNome('Dr. Costa')
        expect(m.nome).toBe('Dr. Costa')
    })

    it('nome setter altera o nome', () => {
        const m = criarMedico()
        m.nome = 'Dr. Souza'
        expect(m.getNome()).toBe('Dr. Souza')
    })

    it('getTelefone retorna o telefone', () => {
        expect(criarMedico().getTelefone()).toBe('27933001234')
    })

    it('setTelefone altera o telefone', () => {
        const m = criarMedico()
        m.setTelefone('27999990000')
        expect(m.telefone).toBe('27999990000')
    })

    it('telefone setter altera o telefone', () => {
        const m = criarMedico()
        m.telefone = '27988880000'
        expect(m.getTelefone()).toBe('27988880000')
    })

    it('getEmail retorna o email', () => {
        expect(criarMedico().getEmail()).toBe('silva@vet.com')
    })

    it('setEmail altera o email', () => {
        const m = criarMedico()
        m.setEmail('novo@vet.com')
        expect(m.email).toBe('novo@vet.com')
    })

    it('email setter altera o email', () => {
        const m = criarMedico()
        m.email = 'outro@vet.com'
        expect(m.getEmail()).toBe('outro@vet.com')
    })
})

describe('Medico getters e setters', () => {
    it('getEspecialidade retorna especialidade', () => {
        expect(criarMedico().getEspecialidade()).toBe('Clínica Geral')
    })

    it('setEspecialidade altera especialidade', () => {
        const m = criarMedico()
        m.setEspecialidade('Cirurgia')
        expect(m.especialidade).toBe('Cirurgia')
    })

    it('getCrmv retorna o CRMV', () => {
        expect(criarMedico().getCrmv()).toBe('12345-ES')
    })

    it('setCrmv altera o CRMV', () => {
        const m = criarMedico()
        m.setCrmv('99999-ES')
        expect(m.crmv).toBe('99999-ES')
    })

    it('crmv setter altera o CRMV', () => {
        const m = criarMedico()
        m.crmv = '11111-ES'
        expect(m.getCrmv()).toBe('11111-ES')
    })
})

describe('Endereco getters e setters', () => {
    it('getRua retorna a rua', () => {
        expect(criarEndereco().getRua()).toBe('Rua das Flores')
    })

    it('setRua altera a rua', () => {
        const e = criarEndereco()
        e.setRua('Av. Brasil')
        expect(e.rua).toBe('Av. Brasil')
    })

    it('rua setter altera a rua', () => {
        const e = criarEndereco()
        e.rua = 'Rua Nova'
        expect(e.getRua()).toBe('Rua Nova')
    })

    it('getNumero retorna o número', () => {
        expect(criarEndereco().getNumero()).toBe(100)
    })

    it('setNumero altera o número', () => {
        const e = criarEndereco()
        e.setNumero(200)
        expect(e.numero).toBe(200)
    })

    it('numero setter altera o número', () => {
        const e = criarEndereco()
        e.numero = 300
        expect(e.getNumero()).toBe(300)
    })

    it('getBairro retorna o bairro', () => {
        expect(criarEndereco().getBairro()).toBe('Centro')
    })

    it('setBairro altera o bairro', () => {
        const e = criarEndereco()
        e.setBairro('Jardim')
        expect(e.bairro).toBe('Jardim')
    })

    it('bairro setter altera o bairro', () => {
        const e = criarEndereco()
        e.bairro = 'Vila'
        expect(e.getBairro()).toBe('Vila')
    })

    it('getCidade retorna a cidade', () => {
        expect(criarEndereco().getCidade()).toBe('Vitória')
    })

    it('setCidade altera a cidade', () => {
        const e = criarEndereco()
        e.setCidade('Serra')
        expect(e.cidade).toBe('Serra')
    })

    it('cidade setter altera a cidade', () => {
        const e = criarEndereco()
        e.cidade = 'Cariacica'
        expect(e.getCidade()).toBe('Cariacica')
    })

    it('getUf retorna a UF', () => {
        expect(criarEndereco().getUf()).toBe('ES')
    })

    it('setUf altera a UF', () => {
        const e = criarEndereco()
        e.setUf('RJ')
        expect(e.uf).toBe('RJ')
    })

    it('uf setter altera a UF', () => {
        const e = criarEndereco()
        e.uf = 'SP'
        expect(e.getUf()).toBe('SP')
    })

    it('getCep retorna o CEP', () => {
        expect(criarEndereco().getCep()).toBe('29010100')
    })

    it('setCep altera o CEP', () => {
        const e = criarEndereco()
        e.setCep('29100200')
        expect(e.cep).toBe('29100200')
    })

    it('cep setter altera o CEP', () => {
        const e = criarEndereco()
        e.cep = '29200300'
        expect(e.getCep()).toBe('29200300')
    })
})

describe('Tutor getters e setters', () => {
    it('getDataCadastro retorna a data', () => {
        const data = new Date('2024-01-01')
        const tutor = new Tutor(1, 'Ana', '27933001234', 'ana@email.com', data, criarEndereco())
        expect(tutor.getDataCadastro()).toEqual(data)
    })

    it('dataCadastro setter altera a data', () => {
        const tutor = criarTutor()
        const nova = new Date('2025-06-01')
        tutor.dataCadastro = nova
        expect(tutor.dataCadastro).toEqual(nova)
    })

    it('getEndereco retorna o endereço', () => {
        const endereco = criarEndereco()
        const tutor = new Tutor(1, 'Ana', '27933001234', 'ana@email.com', new Date(), endereco)
        expect(tutor.getEndereco()).toBe(endereco)
    })

    it('setEndereco altera o endereço', () => {
        const tutor = criarTutor()
        const novoEndereco = new Endereco('Av. Nova', 500, 'Bairro Novo', 'Serra', 'ES', '29100200')
        tutor.setEndereco(novoEndereco)
        expect(tutor.endereco.rua).toBe('Av. Nova')
    })

    it('endereco setter altera o endereço', () => {
        const tutor = criarTutor()
        const novoEndereco = new Endereco('Rua X', 1, 'B', 'C', 'ES', '29000000')
        tutor.endereco = novoEndereco
        expect(tutor.getEndereco().rua).toBe('Rua X')
    })

    it('getPets retorna a lista de pets', () => {
        const tutor = criarTutor()
        expect(tutor.getPets()).toHaveLength(0)
    })
})

describe('Pet getters e setters', () => {
    it('getId retorna o id', () => {
        expect(criarPet(criarTutor(), 5).getId()).toBe(5)
    })

    it('getNome retorna o nome', () => {
        expect(criarPet(criarTutor()).getNome()).toBe('Rex')
    })

    it('getEspecie retorna a espécie', () => {
        expect(criarPet(criarTutor()).getEspecie()).toBe('Cão')
    })

    it('especie setter altera a espécie', () => {
        const pet = criarPet(criarTutor())
        pet.especie = 'Gato'
        expect(pet.especie).toBe('Gato')
    })

    it('setEspecie altera a espécie', () => {
        const pet = criarPet(criarTutor())
        pet.setEspecie('Coelho')
        expect(pet.getEspecie()).toBe('Coelho')
    })

    it('getRaca retorna a raça', () => {
        expect(criarPet(criarTutor()).getRaca()).toBe('Labrador')
    })

    it('raca setter altera a raça', () => {
        const pet = criarPet(criarTutor())
        pet.raca = 'Poodle'
        expect(pet.raca).toBe('Poodle')
    })

    it('setRaca altera a raça', () => {
        const pet = criarPet(criarTutor())
        pet.setRaca('Bulldog')
        expect(pet.getRaca()).toBe('Bulldog')
    })

    it('getTutor retorna o tutor', () => {
        const tutor = criarTutor()
        expect(criarPet(tutor).getTutor()).toBe(tutor)
    })

    it('getHistoricoConsulta retorna lista de consultas', () => {
        expect(criarPet(criarTutor()).getHistoricoConsulta()).toHaveLength(0)
    })
})

describe('Consulta getters e setters', () => {
    it('getId retorna o id', () => {
        const medico = criarMedico()
        const pet = criarPet(criarTutor())
        expect(criarConsulta(medico, pet, 7).getId()).toBe(7)
    })

    it('getDataConsulta retorna a data', () => {
        const medico = criarMedico()
        const pet = criarPet(criarTutor())
        const consulta = criarConsulta(medico, pet)
        expect(consulta.getDataConsulta()).toBeInstanceOf(Date)
    })

    it('getHorario retorna o horário', () => {
        const consulta = criarConsulta(criarMedico(), criarPet(criarTutor()))
        expect(consulta.getHorario()).toBe('09:00')
    })

    it('getDiagnostico retorna o diagnóstico', () => {
        const consulta = criarConsulta(criarMedico(), criarPet(criarTutor()))
        expect(consulta.getDiagnostico()).toBe('Diagnóstico')
    })

    it('diagnostico setter altera o diagnóstico', () => {
        const consulta = criarConsulta(criarMedico(), criarPet(criarTutor()))
        consulta.diagnostico = 'Novo diagnóstico'
        expect(consulta.getDiagnostico()).toBe('Novo diagnóstico')
    })

    it('setDiagnostico altera o diagnóstico', () => {
        const consulta = criarConsulta(criarMedico(), criarPet(criarTutor()))
        consulta.setDiagnostico('Diagnóstico atualizado')
        expect(consulta.diagnostico).toBe('Diagnóstico atualizado')
    })

    it('getObservacoes retorna observações', () => {
        const consulta = criarConsulta(criarMedico(), criarPet(criarTutor()))
        expect(consulta.getObservacoes()).toBe('Obs')
    })

    it('observacoes setter altera observações', () => {
        const consulta = criarConsulta(criarMedico(), criarPet(criarTutor()))
        consulta.observacoes = 'Nova obs'
        expect(consulta.getObservacoes()).toBe('Nova obs')
    })

    it('setObservacoes altera observações', () => {
        const consulta = criarConsulta(criarMedico(), criarPet(criarTutor()))
        consulta.setObservacoes('Obs atualizada')
        expect(consulta.observacoes).toBe('Obs atualizada')
    })

    it('getResponsavel retorna o médico responsável', () => {
        const medico = criarMedico()
        const consulta = criarConsulta(medico, criarPet(criarTutor()))
        expect(consulta.getResponsavel()).toBe(medico)
    })

    it('getPet retorna o pet', () => {
        const pet = criarPet(criarTutor())
        expect(criarConsulta(criarMedico(), pet).getPet()).toBe(pet)
    })

    it('getExames retorna lista de exames', () => {
        expect(criarConsulta(criarMedico(), criarPet(criarTutor())).getExames()).toHaveLength(0)
    })

    it('getDiagnosticoZoonose retorna o diagnóstico de zoonose', () => {
        const consulta = criarConsulta(criarMedico(), criarPet(criarTutor()))
        expect(consulta.getDiagnosticoZoonose()).toBeInstanceOf(DiagnosticoZoonose)
    })
})

describe('DiagnosticoZoonose getters', () => {
    it('getStatus retorna o status', () => {
        expect(new DiagnosticoZoonose('positivo', 'Obs', new Date()).getStatus()).toBe('positivo')
    })

    it('getObservacoes retorna as observações', () => {
        expect(new DiagnosticoZoonose('negativo', 'Sem sinais', new Date()).getObservacoes()).toBe('Sem sinais')
    })

    it('getDataConfirmacao retorna a data', () => {
        const data = new Date('2025-01-01')
        expect(new DiagnosticoZoonose('negativo', 'Obs', data).getDataConfirmacao()).toEqual(data)
    })
})

describe('Zoonose getters', () => {
    it('getId retorna o id', () => {
        expect(new Zoonose(5, 'Raiva', 'Lyssavirus', 'Hidrofobia', 'Vacinação', 'alto').getId()).toBe(5)
    })

    it('getNome retorna o nome', () => {
        expect(new Zoonose(1, 'Raiva', 'Lyssavirus', 'Hidrofobia', 'Vacinação', 'alto').getNome()).toBe('Raiva')
    })

    it('getAgenteEtiologico retorna o agente', () => {
        expect(new Zoonose(1, 'Raiva', 'Lyssavirus', 'Hidrofobia', 'Vacinação', 'alto').getAgenteEtiologico()).toBe('Lyssavirus')
    })

    it('getSintomas retorna os sintomas', () => {
        expect(new Zoonose(1, 'Raiva', 'Lyssavirus', 'Hidrofobia', 'Vacinação', 'alto').getSintomas()).toBe('Hidrofobia')
    })

    it('getMedidasPreventivas retorna as medidas', () => {
        expect(new Zoonose(1, 'Raiva', 'Lyssavirus', 'Hidrofobia', 'Vacinação', 'alto').getMedidasPreventivas()).toBe('Vacinação')
    })

    it('getGrauRisco retorna o grau', () => {
        expect(new Zoonose(1, 'Raiva', 'Lyssavirus', 'Hidrofobia', 'Vacinação', 'medio').getGrauRisco()).toBe('medio')
    })

    it('isAltoRisco retorna false para grau medio', () => {
        expect(new Zoonose(1, 'X', 'Y', 'Z', 'W', 'medio').isAltoRisco()).toBe(false)
    })
})

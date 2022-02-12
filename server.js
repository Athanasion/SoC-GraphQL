const express = require('express')
const expressGraphQL = require('express-graphql').graphqlHTTP
const sqlite3 = require("sqlite3").verbose();
const util = require("util");

// Connecting to the database
const db = new sqlite3.Database("./uni.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
    console.log("Connection to DataBase Successful");
});

// Async issue fixes 
db.all = util.promisify(db.all);
db.get = util.promisify(db.get);

async function db_run(sql, params)  {
    return new Promise((res, rej) => {
        db.run(sql, params, function (err) {
            if (err) rej(err);
            res(this.lastID);
        })
    }) 
}

const{
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull
} = require('graphql');
const { resolve } = require('path');
const app = express()

// GraphQL Type representing a university subject.
const SubjectType = new GraphQLObjectType({
    name: "Subject",
    description: "This represents a subject object",
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt) },
        subjectCode: { type: GraphQLNonNull(GraphQLString) },
        title: { type: GraphQLNonNull(GraphQLString) },
        profID: { type: GraphQLNonNull(GraphQLInt) },
        professor: {
            type: ProfessorType,
            resolve: (subject) => {
                return db.get('SELECT * FROM professors WHERE id = ?', [subject.profID]);
            }
        }
    })
})

// GraphQL Type representing a university professor.
const ProfessorType = new GraphQLObjectType({
    name: "Professor",
    description: "This represents a professor object",
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLNonNull(GraphQLString)},
        surname: { type: GraphQLNonNull(GraphQLString)},
        telephoneNumber: { type: GraphQLNonNull(GraphQLString)},
        subjects: {
            type: new GraphQLList(SubjectType),
            resolve: (professor) => {
                return db.all('SELECT * FROM subjects WHERE profID = ?', [professor.id]);
            }
        }
    })
})

// All available Queries
const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        professors: {
            type: new GraphQLList(ProfessorType),
            description: "List of all professors",
            resolve: () => db.all('SELECT * FROM professors')
        },
        professor: {
            type: ProfessorType,
            description: "A single professor",
            args: {
                id: {type: GraphQLInt}
            },
            resolve: (parent, args) => db.get('SELECT * FROM professors WHERE id = ?', [args.id])
        },
        subjects: {
            type: new GraphQLList(SubjectType),
            description: "List of all subjects",
            resolve: () => db.all('SELECT * FROM subjects')
        },
        subject: {
            type: SubjectType,
            description: "A single subject",
            args: {
                id: {type: GraphQLInt}
            },
            resolve: (parent, args) => db.get('SELECT * FROM subjects WHERE id = ?', [args.id])
        }
    })
})

// All available Mutations.
// Add, Update & Delete mutations for subjects and professors.
const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root Mutation',
    fields: () => ({
        // Professor Mutations
        addProfessor: {
            type: ProfessorType,
            description: "Add a professor",
            args: {
                name: { type: GraphQLNonNull(GraphQLString)},
                surname: { type: GraphQLNonNull(GraphQLString)},
                telephoneNumber: { type: GraphQLNonNull(GraphQLString)}
            },
            resolve: async (parent, args) => {
                const lastId = await db_run('INSERT INTO professors VALUES(NULL, ?, ?, ?)', [args.name, args.surname, args.telephoneNumber]);
                return db.get('SELECT * FROM professors WHERE id = ?', [lastId]);
            }
        },
        updateProfessor: {
            type: ProfessorType,
            description: "Update info on a professor",
            args: {
                id: { type: GraphQLNonNull(GraphQLInt) },
                name: { type: GraphQLNonNull(GraphQLString)},
                surname: { type: GraphQLNonNull(GraphQLString)},
                telephoneNumber: { type: GraphQLNonNull(GraphQLString)}
            },
            resolve: async (parent, args) => {
                const lastId = await db_run('UPDATE professors SET name = ?, surname = ?, telephoneNumber = ? WHERE id = ?', [args.name, args.surname, args.telephoneNumber, args.id]);
                return db.get('SELECT * FROM professors WHERE id = ?', [args.id]);
            }
        },
        deleteProfessor: {
            type: ProfessorType,
            description: "Delete a professor",
            args: {
                id: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: async (parent, args) => {
                const lastId = await db_run('DELETE FROM professors WHERE id = ?', [args.id]);
                return null;
            }
        },

        // Subject Mutations
        addSubject: {
            type: SubjectType,
            description: "Add a subject",
            args: {
                subjectCode: { type: GraphQLNonNull(GraphQLString) },
                title: { type: GraphQLNonNull(GraphQLString) },
                profID: { type: GraphQLNonNull(GraphQLInt) },
            },
            resolve : async (parent, args) => {
                const lastId = await db_run('INSERT INTO subjects VALUES(NULL, ?, ?, ?)', [args.subjectCode, args.title, args.profID]);
                return db.get('SELECT * FROM subjects WHERE id = ?', [lastId]);
            }
        },
        updateSubject: {
            type: SubjectType,
            description: "Update info on a subject",
            args: {
                id: { type: GraphQLNonNull(GraphQLInt) },
                subjectCode: { type: GraphQLNonNull(GraphQLString) },
                title: { type: GraphQLNonNull(GraphQLString) },
                profID: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: async (parent, args) => {
                const lastId = await db_run('UPDATE subjects SET subjectCode = ?, title = ?, profID = ? WHERE id = ?', [args.subjectCode, args.title, args.profID, args.id]);
                return db.get('SELECT * FROM subjects WHERE id = ?', [args.id]);
            }
        },
        deleteSubject: {
            type: SubjectType,
            description: "Delete a subject",
            args: {
                id: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: async (parent, args) => {
                const lastId = await db_run('DELETE FROM subjects WHERE id = ?', [args.id]);
                return null;
            }
        }            
    })
})

// Μy shema
const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
})

app.use('/graphql', expressGraphQL({
    schema: schema,
    graphiql: true
}))
app.listen(5000., () => console.log("Server is running"))

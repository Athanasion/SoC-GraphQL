const express = require('express')
const expressGraphQL = require('express-graphql').graphqlHTTP
const{
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull
} = require('graphql')
const app = express()

const professors = [
    { id: 1, name: "Glenn",  surname: "Purver",   telephoneNumber: "4259600470" },
    { id: 2, name: "Dougie", surname: "Amys",     telephoneNumber: "2494364944" },
    { id: 3, name: "Rakel" , surname: "Bedberry", telephoneNumber: "6412661133" },
    { id: 4, name: "Borden", surname: "Pfeifer",  telephoneNumber: "9066694302" }
]

const subjects = [
    { id: 1, subjectCode: "NCO-1",  title: "Programming I",           profID: 2 },
    { id: 2, subjectCode: "NCO-2",  title: "Programming II",          profID: 4 },
    { id: 3, subjectCode: "NBX-1",  title: "Algorithms I",            profID: 1 },
    { id: 4, subjectCode: "NBX-2",  title: "Algorithms II",           profID: 1 },
    { id: 5, subjectCode: "NBX-14", title: "Intro to Databases",      profID: 3 },
    { id: 6, subjectCode: "NCC-34", title: "GraphQL with JavaScript", profID: 3 },
]

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
                return professors.find(professor => professor.id === subject.profID)
            }
        }
    })
})

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
                return subjects.filter(subject => subject.profID === professor.id)
            }
        }
    })
})

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        professors: {
            type: new GraphQLList(ProfessorType),
            description: "List of all professors",
            resolve: () => professors
        },
        professor: {
            type: ProfessorType,
            description: "A single professor",
            args: {
                id: {type: GraphQLInt}
            },
            resolve: (parent, args) => professors.find(professor => professor.id === args.id)
        },
        subjects: {
            type: new GraphQLList(SubjectType),
            description: "List of all subjects",
            resolve: () => subjects
        },
        subject: {
            type: SubjectType,
            description: "A single subject",
            args: {
                id: {type: GraphQLInt}
            },
            resolve: (parent, args) => subjects.find(subject => subject.id === args.id)
        }
    })
})

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root Mutation',
    fields: () => ({
        addProfessor: {
            type: ProfessorType,
            description: "Add a professor",
            args: {
                name: { type: GraphQLNonNull(GraphQLString)},
                surname: { type: GraphQLNonNull(GraphQLString)},
                telephoneNumber: { type: GraphQLNonNull(GraphQLString)}
            },
            resolve: (parent, args) => {
                const professor = {id: professors.length + 1, name: args.name, surname: args.surname, telephoneNumber: args.telephoneNumber}
                professors.push(professor)
                return professor
            }
            
        },
        updateProfessor: {
            type: ProfessorType,
            description: "Update info on a professor",
            args: {
                ChangeID: { type: GraphQLNonNull(GraphQLInt) },
                name: { type: GraphQLNonNull(GraphQLString)},
                surname: { type: GraphQLNonNull(GraphQLString)},
                telephoneNumber: { type: GraphQLNonNull(GraphQLString)}
            },
            resolve: (parent, args) => {
                const professor = professors.find(professor => professor.id === args.ChangeID)
                professor.name = args.name
                professor.surname = args.surname
                professor.telephoneNumber = args.telephoneNumber
                return professor
            }
        },
        addSubject: {
            type: SubjectType,
            description: "Add a subject",
            args: {
                subjectCode: { type: GraphQLNonNull(GraphQLString) },
                title: { type: GraphQLNonNull(GraphQLString) },
                profID: { type: GraphQLNonNull(GraphQLInt) },
            },
            resolve: (parent, args) => {
                const subject = {id: subjects.length + 1, subjectCode: args.subjectCode, title: args.title, profID: args.profID}
                subjects.push(subject)
                return subject
            }
        },
        updateSubject: {
            type: SubjectType,
            description: "Update info on a subject",
            args: {
                ChangeID: { type: GraphQLNonNull(GraphQLInt) },
                subjectCode: { type: GraphQLNonNull(GraphQLString) },
                title: { type: GraphQLNonNull(GraphQLString) },
                profID: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: (parent, args) => {
                const subject = subjects.find(subject => subject.id === args.ChangeID)
                subject.subjectCode = args.subjectCode
                subject.title = args.title
                subject.profID = args.profID
                return subject
            }
        }       
    })
})

const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
})

app.use('/graphql', expressGraphQL({
    schema: schema,
    graphiql: true
}))
app.listen(5000., () => console.log("Server is running"))

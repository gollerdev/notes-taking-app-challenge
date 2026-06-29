import factory
from factory.django import DjangoModelFactory
from faker import Faker

from apps.notes.models import Category

fake = Faker()


class NoteFactory(DjangoModelFactory):
    class Meta:
        model = "notes.Note"

    owner = factory.SubFactory("apps.authentication.tests.factories.UserFactory")
    title = factory.LazyFunction(fake.sentence)
    body = factory.LazyFunction(fake.paragraph)
    category = factory.LazyFunction(
        lambda: fake.random_element(elements=[c.value for c in Category])
    )
    is_deleted = False
